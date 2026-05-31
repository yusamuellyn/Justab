import os
import uuid
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import re
import cv2
import pytesseract
from pytesseract import Output
from difflib import get_close_matches
import nltk

from supabase import create_client, Client 
from dotenv import load_dotenv

import json 
import requests
import numpy as np
import ssl 
load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)
app = FastAPI()

# Client and server are on different origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_TYPES = ["image/png", "image/jpeg", "application/octet-stream"]
@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        return {"error": "Invalid File Type"}
    
    try:
        contents = await file.read()
        ext = os.path.splitext(file.filename or "")[1] or ".png"
        file_path = f"{uuid.uuid4().hex}{ext}"
        
        supabase.storage.from_("receipts").upload(
            file_path,
            contents,
            file_options={"content-type": file.content_type}
        )
        
        public_url = supabase.storage.from_("receipts").get_public_url(file_path)
        
        #Sends a reqest to get the image from supabase
        resp = requests.get(public_url)


        # Word Stuff
        ssl._create_default_https_context = ssl._create_unverified_context
        nltk.download('words', quiet=True)
        from nltk.corpus import words as english_words
        english_word_set = set(w.lower() for w in english_words.words())

        # As Long As Word Similar To English Language One
        def is_real_word(word):
            return bool(get_close_matches(word.lower(), english_word_set, n=1, cutoff=0.8))

        # List of Ignore Words, Including Matches With 75%+ Confidence
        ignore_words = ['sr', 'zrl', 'tumt', 'zr', 'cash', 'change', 'total', 'subtotal', 'gst', 'tax', 'amount', 'cashier', 'summary', 'payment', 'details', 'count', 'iten', 'tlrh', 'rm', 'funding', 'adjustment', 'rounding', 'rounded', 'desc', 'qty', 'price', 'disc', 'gratuity', '%']
        def should_ignore(word, ignore_words, cutoff=0.75):
            return bool(get_close_matches(word.strip().lower(), ignore_words, n=1, cutoff=cutoff))

        def process_receipt(image_path):

            # Brings In Image
            img = cv2.imdecode(np.asarray(bytearray(image_path.content), dtype="uint8"), cv2.IMREAD_COLOR)
            
            # Adding Custom Settings For Tesseract
            custom_config = r'--oem 3 --psm 6' # Custom Parameters (oem controls engine to use, 3 is for general purposes. psm is text interpretation - 6 is one block)
            text = pytesseract.image_to_string(img, config=custom_config) # Gives image to tesseract alongside above configurations.

            # Special Text Issue Cases, With 0/O At End
            text = re.sub(r'[lI|]', '1', text)
            text_norm = re.sub(r'[@oO]', '0', text)

            # Split Text By Lines
            line_div = text_norm.split('\n')

            # Important Variables
            number_array = ['1','2','3','4', '5', '6', '7', '8', '9', '0']
            price_array = []
            item_array = []

            # Finds Price Using Number Based Logic
            for i in range(len(text_norm) - 2):
                if text_norm[i] == '.':
                    if text_norm[i+1] in number_array:
                        if text_norm[i+2] in number_array:

                            # Deals With Number In Front of Period
                            j = i - 1
                            int_num = ''

                            while j >= 0 and text_norm[j] in number_array:
                                int_num = text_norm[j] + int_num
                                j -= 1

                            # Skips Numbers With 3 Decimals +
                            if i + 3 < len(text_norm) and text_norm[i+3].isdigit():
                                continue

                            # Skips If Part of Larger Alphanumeric String
                            char_before = text_norm[j] if j >= 0 else ' '
                            if char_before.isalpha() or char_before.isdigit():
                                continue

                            # Adds Price To Price_Array With Double Checked Format
                            price = int_num + text_norm[i] + text_norm[i+1] + text_norm[i+2]
                            if re.match(r'^\d{1,4}\.\d{2}$', price):
                                price_array.append(price)

            # For Each Line In Text With A Price In Price_Array
            # 1 - Checks To Make Sure Price Not Repeated In Line
            # 2 - Ensures Letters Only
            for l in line_div:
                seen_in_line = set()
                for h in range(len(price_array)):
                    if price_array[h] in l and price_array[h] not in seen_in_line:
                        seen_in_line.add(price_array[h])
                        l_split = l.split(price_array[h])[0]
                        letters_only = re.sub(r'[^a-zA-Z\s]', '', l_split)
                        if letters_only.strip():
                            item_array.append(letters_only)

            # List of Ignore Words In Lowercase and Abcd Formats
            ignore_words_upper = [w.upper() for w in ignore_words]
            ignore_words_title = [w.title() for w in ignore_words]

            # Loops In Reverse Order, Using The Shorter Array To Avoid Errors
            for s in range(min(len(price_array), len(item_array)) - 1, -1, -1):
                # If Any Word Matches One In Ignore List, Remove Index From Both Arrays
                if any(should_ignore(word, ignore_words) for word in item_array[s].strip().lower().split()):
                    price_array.remove(price_array[s])
                    item_array.remove(item_array[s])

            # Price Organization Logic
            # If There Are No Prices Detected, New Image Needed
            if len(price_array) == 0:
                return None, None

            else:
                item_button_display = []

                # For Normal Cases
                if len(item_array) != 0:

                    # Adds English Language Term If Possible
                    for a in range(len(price_array)):
                        words = item_array[a].strip().lower().split() if a < len(item_array) else []
                        if any(is_real_word(word) for word in words):
                            item_button_display.append(f"{item_array[a].strip()} / Cost: {price_array[a]}")
                        # Inputs Item # If English Language Word Not Detected
                        else:
                            item_button_display.append(f"Item {a + 1} / Cost: {price_array[a]}")

                # For Cases On Different Line
                else:
                    for a in range(len(price_array)):
                        item_button_display.append(f"Item {a + 1} / Cost: {price_array[a]}")

                return price_array, item_button_display


        # Test
        price_array, items = process_receipt(resp)
        if items is None:
            return {"message": "Invalid Receipt"}
        else:
            print(items)
            itemList = {}
            length = 0
            for item, price in zip(items, price_array): 
                itemList[item] = price
                length = length + 1
                
            with open("receipt.json", "w") as file:
                json.dump(itemList, file)
            
            supabase.table("receipts").insert({
            "receipt_url": public_url,
            "items": itemList
            }).execute()
            return {"items": itemList, "receipt_url": public_url}
    
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")
        

   