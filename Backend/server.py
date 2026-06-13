import os
from urllib import response
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

import secrets 
load_dotenv()

import random

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


# if platform.system() == 'Windows':
#     pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
# else:
#     pytesseract.pytesseract.tesseract_cmd = 'tesseract'



url = os.environ.get("EXPO_PUBLIC_SUPABASE_URL") # Change To SUPABASE_URL / KEY
key = os.environ.get("EXPO_PUBLIC_SUPABASE_KEY")
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


def makeCode():
     letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
     ucLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
     numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
    
     finalString = ""

     for i in range(0,4):
        random_Index_L = random.randrange(len(letters))
        random_Index_N = random.randrange(len(numbers))
        random_Form = random.randrange(0,3)

        if (random_Form) == 0: 
            finalString = finalString + f"{letters[random_Index_L]}"
        
        if (random_Form) == 1: 
            finalString = finalString + f"{ucLetters[random_Index_L]}"

        if (random_Form) == 2: 
            finalString = finalString + f"{numbers[random_Index_N]}"

     return finalString  

def makeID():
 letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
 ucLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
 numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

 finalID = ""
 for i in range(0,8):
        random_Index_L = random.randrange(len(letters))
        random_Index_N = random.randrange(len(numbers))
        random_Form = random.randrange(0,3)

        if (random_Form) == 0: 
            finalID = finalID+ f"{letters[random_Index_L]}"
        
        if (random_Form) == 1: 
            finalID = finalID + f"{ucLetters[random_Index_L]}"

        if (random_Form) == 2: 
            finalID = finalID+ f"{numbers[random_Index_N]}"

 return finalID   

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
            return bool(get_close_matches(word.lower(), english_word_set, n=1, cutoff=0.9))

        # List of Ignore Words, Including Matches With 85%+ Confidence
        ignore_words = ['sr', 'zrl', 'tumt', 'zr', 'cash', 'change', 'total', 'subtotal', 'gst', 'tax', 'amount', 'cashier', 'summary', 'payment', 'details', 'count', 'iten', 'tlrh', 'rm', 'funding', 'adjustment', 'rounding', 'rounded', 'desc', 'qty', 'price', 'disc', 'gratuity', '%']
        def should_ignore(word, ignore_words, cutoff=0.85):
            return bool(get_close_matches(word.strip().lower(), ignore_words, n=1, cutoff=cutoff))

        def process_receipt(image_path):

            # Brings In Image
            img = cv2.imdecode(np.asarray(bytearray(image_path.content), dtype="uint8"), cv2.IMREAD_COLOR)
            
            # Preprocessing
            
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            gray = cv2.medianBlur(gray, 3)
            gray = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 11)


            # Adding Custom Settings For Tesseract
            custom_config = r'--oem 3 --psm 6' # Custom Parameters (oem controls engine to use, 3 is for general purposes. psm is text interpretation - 6 is one block)
            text = pytesseract.image_to_string(gray, config=custom_config) # Gives image to tesseract alongside above configurations.

            # Special Text Issue Cases, With 0/O At End
            text_norm = text

            text_norm = re.sub(r'[lI|]', '1', text)
            text_norm = re.sub(r'[@oO]', '0', text_norm)

            # Split Text By Lines
            line_div = text.split('\n')
            line_div_norm = text_norm.split('\n')

            # Important Variables
            number_array = ['1','2','3','4', '5', '6', '7', '8', '9', '0']
            price_array = []
            item_array = []
            totalPrice = None 
            # Above Can Also = 0

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


            # Keep only the rightmost (Total) price per line
            filtered_price_array = []
            for l in line_div_norm:
                prices_in_line = [p for p in price_array if p in l]
                if prices_in_line:
                  last_price = max(prices_in_line, key=lambda p: l.rfind(p)) # Specifically This Line
                
                  if last_price not in filtered_price_array:
                    filtered_price_array.append(last_price)
            price_array = filtered_price_array


            # For Each Line In Text With A Price In Price_Array
            # 1 - Checks To Make Sure Price Not Repeated In Line
            # 2 - Ensures Letters Only
            # for l in line_div:
            #     seen_in_line = set()
            #     for h in range(len(price_array)):
            #         if price_array[h] in l and price_array[h] not in seen_in_line:
            #             seen_in_line.add(price_array[h])
            #             l_split = l.split(price_array[h])[0]
            #             letters_only = re.sub(r'[^a-zA-Z\s]', '', l_split)

            # Reworked By Claude To Fix Number/Letter "cassic" issue. Understand Friday. 
            for idx, l in enumerate(line_div):
                norm_l = line_div_norm[idx] if idx < len(line_div_norm) else l
                seen_in_line = set()
                for h in range(len(price_array)):
                 if price_array[h] in norm_l and price_array[h] not in seen_in_line:
                  seen_in_line.add(price_array[h])
                  pos = norm_l.find(price_array[h])
                  l_split = l[:pos]
                  letters_only = re.sub(r'[^a-zA-Z\s]', '', l_split)

                  #AI slop At Beginning Fix
                  words = letters_only.strip().split()
                  while words and len(words[0]) <= 3 and not is_real_word(words[0]):
                     words.pop(0)
                  cleaned_name = ' '.join(words)
                  
                  # This also VC, understand ASAP
                  if "total" in cleaned_name.lower() and "sub" not in cleaned_name.lower():
                      totalPrice = price
                      continue

                  if cleaned_name:
                     item_array.append(cleaned_name)
                      

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
                return None, None, None

            else:
                item_button_display = []

                # For Normal Cases
                if len(item_array) != 0:

                    # Adds English Language Term If Possible
                    for a in range(len(price_array)):
                        words = item_array[a].strip().lower().split() if a < len(item_array) else []
                        if any(is_real_word(word) for word in words):
                            item_button_display.append(f"{item_array[a].strip()}")
                        # Inputs Item # If English Language Word Not Detected
                        else:
                            item_button_display.append(f"Item {a + 1}")

                # For Cases On Different Line
                else:
                    for a in range(len(price_array)):
                        item_button_display.append(f"Item {a + 1}")

                return price_array, item_button_display, totalPrice
            
        # Test
        price_array, items, totalPrice = process_receipt(resp)
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
                

            partyJoinCode = makeCode()
            print(f"Generated code: {partyJoinCode}")
            response = supabase.table("receipts").insert({
            "receipt_url": public_url,
            "items": itemList,
            "partyJoinCode": partyJoinCode,
            "total": totalPrice

            }).execute()
            return {"id": response.data[0]["id"]}
    
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")






   

@app.post("/add-tip")   
async def update_tip(tip: int, id: int):
    try:
        response = (
            supabase.table("receipts")
            .update({"tip": tip})
            .eq("id", id)
            .execute()
        )
        return {"success": "Tip upload successfully"}
    except Exception as e: 
        raise HTTPException(status_code=500, detail = f"{type(e).__name__}: {e}" )
        
         
@app.get("/receipt-info")
async def upload_image(id: int):
    try:
        response = (
        supabase.table("receipts")
        .select("items, tax, tip, total, partyJoinCode")
        .eq("id", id)
        .execute()
        )
        return {"info": response.data[0]}
    except Exception as e: 
        raise HTTPException(status_code=500, detail = f"{type(e).__name__}: {e}" )
    

@app.post("/createParty")
async def createParty(userName: str, id: str):
    partyID = makeID()
    role = "Leader"
    

    

    supabase.table("partyMaking").insert({
    "partyID": partyID,
    "partyRole": role,
    "user": userName
           
    }).execute()


    supabase.table("receipts").update({"partyID": partyID}).eq("id", id).execute()

    return {"partyID": partyID}


@app.post("/joinParty")
async def joinParty(code:str, userName: str):
    
    role = "Member"
    response = supabase.table("receipts").select("partyJoinCode, partyID").eq("partyJoinCode", code).execute()


    if not response.data:
        raise HTTPException(status_code=404, detail="Party not found")

    partyID = response.data[0]["partyID"]
    
    supabase.table("partyMaking").insert({
        "partyID": partyID,
        "partyRole": role,
        "user": userName,
        "userInput": code,
    }).execute()
    
    return {"partyID": partyID}

@app.get("/displayMembers")
async def displayMembers(partyID: str):
    response = supabase.table("partyMaking").select("*").eq("partyID", partyID).execute()
    
    return {"members": response.data}

    