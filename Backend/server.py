import os
from urllib import response
import uuid
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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

import random

pytesseract.pytesseract.tesseract_cmd = r'/opt/homebrew/bin/tesseract'


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

ALLOWED_TYPES = ["image/png", "image/jpeg", "image/heic", "image/heif", "application/octet-stream"]

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
       
        resp = requests.get(public_url)

        ssl._create_default_https_context = ssl._create_unverified_context
        nltk.download('words', quiet=True)
        from nltk.corpus import words as english_words
        english_word_set = set(w.lower() for w in english_words.words())

        def is_real_word(word):
            return bool(get_close_matches(word.lower(), english_word_set, n=1, cutoff=0.9))

        ignore_words = ['sr', 'zrl', 'tumt', 'zr', 'cash', 'change', 'total', 'subtotal', 'gst', 'tax', 'amount', 'cashier', 'summary', 'payment', 'details', 'count', 'iten', 'tlrh', 'rm', 'funding', 'adjustment', 'rounding', 'rounded', 'desc', 'qty', 'price', 'disc', 'gratuity', '%']
        def should_ignore(word, ignore_words, cutoff=0.85):
            return bool(get_close_matches(word.strip().lower(), ignore_words, n=1, cutoff=cutoff))

        def process_receipt(image_path):

            img = cv2.imdecode(np.asarray(bytearray(image_path.content), dtype="uint8"), cv2.IMREAD_COLOR)
           
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            gray = cv2.resize(gray, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_CUBIC)
            _, gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

            custom_config = r'--oem 3 --psm 6'
            text = pytesseract.image_to_string(gray, config=custom_config)

            text_norm = re.sub(r'[lI|]', '1', text)
            text_norm = re.sub(r'[@oO]', '0', text_norm)

            line_div = text.split('\n')
            line_div_norm = text_norm.split('\n')

            number_array = ['1','2','3','4', '5', '6', '7', '8', '9', '0']
            price_array = []
            item_array = []
            totalPrice = None
            taxPrice = None

            for i in range(len(text_norm) - 2):
                if text_norm[i] == '.':
                    if text_norm[i+1] in number_array:
                        if text_norm[i+2] in number_array:

                            j = i - 1
                            int_num = ''

                            while j >= 0 and text_norm[j] in number_array:
                                int_num = text_norm[j] + int_num
                                j -= 1

                            if i + 3 < len(text_norm) and text_norm[i+3].isdigit():
                                continue

                            char_before = text_norm[j] if j >= 0 else ' '
                            if char_before.isalpha() or char_before.isdigit():
                                continue

                            price = int_num + text_norm[i] + text_norm[i+1] + text_norm[i+2]
                            if re.match(r'^\d{1,4}\.\d{2}$', price):
                                price_array.append(price)

            filtered_price_array = []
            for l in line_div_norm:
                prices_in_line = [p for p in price_array if p in l]
                if prices_in_line:
                    last_price = max(prices_in_line, key=lambda p: l.rfind(p))
                    if last_price not in filtered_price_array:
                        filtered_price_array.append(last_price)
            price_array = filtered_price_array

            for idx, l in enumerate(line_div):
                norm_l = line_div_norm[idx] if idx < len(line_div_norm) else l
                seen_in_line = set()
                for h in range(len(price_array)):
                    if price_array[h] in norm_l and price_array[h] not in seen_in_line:
                        seen_in_line.add(price_array[h])
                        pos = norm_l.find(price_array[h])
                        l_split = l[:pos]
                        letters_only = re.sub(r'[^a-zA-Z\s]', '', l_split)

                        words = letters_only.strip().split()
                        while words and len(words[0]) <= 2:
                            words.pop(0)
                        while words and len(words[-1]) <= 1:
                            words.pop()
                        cleaned_name = ' '.join(words)

                        line_lower = l.lower()
                        skip_keywords = {'subtotal', 'sub total', 'total', 'tax', 'tip', 'tend', 'change', 'cash'}

                        if any(kw in line_lower for kw in skip_keywords):
                            if 'total' in line_lower and 'sub' not in line_lower and 'subtotal' not in line_lower:
                                totalPrice = price_array[h]
                            elif 'tax' in line_lower:
                                taxPrice = price_array[h]
                            continue

                        if cleaned_name:
                            item_array.append(cleaned_name)

            for s in range(min(len(price_array), len(item_array)) - 1, -1, -1):
                if any(should_ignore(word, ignore_words) for word in item_array[s].strip().lower().split()):
                    price_array.remove(price_array[s])
                    item_array.remove(item_array[s])

            if len(price_array) == 0:
                return None, None, None, None

            else:
                item_button_display = []

                if len(item_array) != 0:
                    for a in range(len(price_array)):
                        words = item_array[a].strip().lower().split() if a < len(item_array) else []
                        if any(is_real_word(word) for word in words):
                            item_button_display.append(f"{item_array[a].strip()}")
                        else:
                            item_button_display.append(f"Item {a + 1}")
                else:
                    for a in range(len(price_array)):
                        item_button_display.append(f"Item {a + 1}")

                return price_array, item_button_display, totalPrice, taxPrice
            
        price_array, items, totalPrice, taxPrice = process_receipt(resp)
        partyJoinCode = makeCode()
        partyID = makeID()

        supabase.table("partyMaking").insert({
            "partyID": partyID,
            "partyRole": "Leader",
            "user": "Leader",
        }).execute()

        # ✅ If receipt couldn't be parsed, still create row and return id with warning
        if items is None:
            response = supabase.table("receipts").insert({
                "receipt_url": public_url,
                "items": {},
                "tax": None,
                "partyJoinCode": partyJoinCode,
                "total": None,
                "partyID": partyID
            }).execute()
            return {"warning": True, "id": response.data[0]["id"]}

        print(items)
        itemList = {}
        for item, price in zip(items, price_array):
            itemList[item] = price

        with open("receipt.json", "w") as file:
            json.dump(itemList, file)

        print(f"Generated code: {partyJoinCode}")

        response = supabase.table("receipts").insert({
            "receipt_url": public_url,
            "items": itemList,
            "tax": taxPrice,
            "partyJoinCode": partyJoinCode,
            "total": totalPrice,
            "partyID": partyID
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
        .select("items, tax, tip, total, partyJoinCode, partyID")
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

@app.get("/displayItems")
async def displayItems(partyID: str):
    response = supabase.table("receipts").select("items, splitDisplay").eq("partyID", partyID).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Receipt not found")

    receipt = response.data[0]
    raw_items = receipt["items"] or {}

    try:
        splitDisplay = json.loads(receipt["splitDisplay"]) if receipt["splitDisplay"] else {}
    except (json.JSONDecodeError, TypeError):
        splitDisplay = {}

    items = []
    for index, (name, price) in enumerate(raw_items.items()):
        items.append({
            "name": name,
            "price": float(price),
            "claims": splitDisplay.get(str(index), []),
        })

    return {"items": items}

@app.post("/claimItem")
async def claimItem(partyID: str, itemIndex: str, userName: str):
    response = supabase.table("receipts").select("splitDisplay").eq("partyID", partyID).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Receipt not found")

    try:
        splitDisplay = json.loads(response.data[0]["splitDisplay"]) if response.data[0]["splitDisplay"] else {}
    except (json.JSONDecodeError, TypeError):
        splitDisplay = {}

    claimants = splitDisplay.get(itemIndex, [])

    if userName in claimants:
        claimants.remove(userName)
    else:
        claimants.append(userName)

    splitDisplay[itemIndex] = claimants
    supabase.table("receipts").update({"splitDisplay": json.dumps(splitDisplay)}).eq("partyID", partyID).execute()

    return {"claims": claimants}

@app.get("/displayTotals")
async def displayTotals(partyID: str):
    response = supabase.table("receipts").select("items, splitDisplay, tax, tip").eq("partyID", partyID).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Receipt not found")

    receipt = response.data[0]
    raw_items = receipt["items"] or {}

    try:
        splitDisplay = json.loads(receipt["splitDisplay"]) if receipt["splitDisplay"] else {}
    except (json.JSONDecodeError, TypeError):
        splitDisplay = {}

    totals = {}
    unclaimed_cents = 0

    for index, (name, price) in enumerate(raw_items.items()):
        price_cents = round(float(price) * 100)
        claimants = splitDisplay.get(str(index), [])

        if not claimants:
            unclaimed_cents += price_cents
            continue

        base = price_cents // len(claimants)
        remainder = price_cents % len(claimants)
        for i, person in enumerate(claimants):
            share = base + (1 if i < remainder else 0)
            totals[person] = totals.get(person, 0) + share

    claimed_subtotal_cents = sum(totals.values())

    tax_cents = round(float(receipt.get("tax") or 0) * 100)
    tip_percent = receipt.get("tip") or 0
    tip_cents = round(claimed_subtotal_cents * (tip_percent / 100))

    extra_cents = tax_cents + tip_cents

    if claimed_subtotal_cents > 0 and extra_cents > 0:
        people = list(totals.keys())
        running = 0
        for i, person in enumerate(people):
            if i == len(people) - 1:
                share = extra_cents - running
            else:
                share = round(extra_cents * (totals[person] / claimed_subtotal_cents))
                running += share
            totals[person] += share

    result = [{"user": person, "owes": cents / 100} for person, cents in totals.items()]

    return {
        "totals": result,
        "unclaimed": unclaimed_cents / 100,
        "tax": tax_cents / 100,
        "tip": tip_cents / 100,
    }

@app.post("/updateLeaderName")
async def updateLeaderName(partyID: str, userName: str):
    supabase.table("partyMaking").update({"user": userName}).eq("partyID", partyID).eq("partyRole", "Leader").execute()
    return {"success": True}

@app.get("/checkStatus")
async def checkStatus(partyID: str):
    response = supabase.table("receipts").select("status").eq("partyID", partyID).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Party not found")
    return {"status": response.data[0]["status"]}

@app.post("/manualAdd") # Post and Get Diff?
async def addItem(id: int, itemName: str, itemPrice: str):
    response = supabase.table("receipts").select("items").eq("id", id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    current_items = response.data[0]["items"] or {}
    current_items[itemName] = itemPrice
    
    supabase.table("receipts").update({"items": current_items}).eq("id", id).execute()
    
    return {"items": current_items}

@app.post("/removeItem")
async def removeItem(id: int, itemName: str):
    response = supabase.table("receipts").select("items").eq("id", id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    current_items = response.data[0]["items"] or {}
    if itemName in current_items:
        del current_items[itemName]
    
    supabase.table("receipts").update({"items": current_items}).eq("id", id).execute()
    
    return {"items": current_items}