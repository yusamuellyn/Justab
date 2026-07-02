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

ALLOWED_TYPES = ["image/png", "image/jpeg", "image/heic", "image/heif", "application/octet-stream"]

#Rework Later For Non-repition
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









import os
import re
import uuid
import json
import cv2
import numpy as np
import nltk
import pytesseract
import requests
from difflib import get_close_matches
from fastapi import UploadFile, File, HTTPException

# ── Module-level init (runs once at startup, not per request) ─────────────────

nltk.download('words', quiet=True)
from nltk.corpus import words as _english_words
ENGLISH_WORD_SET = set(w.lower() for w in _english_words.words())

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}

IGNORE_WORDS = [
    'sr', 'zrl', 'tumt', 'zr', 'cash', 'change', 'total', 'subtotal',
    'gst', 'tax', 'amount', 'cashier', 'summary', 'payment', 'details',
    'count', 'iten', 'tlrh', 'rm', 'funding', 'adjustment', 'rounding',
    'rounded', 'desc', 'qty', 'price', 'disc', 'gratuity',
]

SKIP_KEYWORDS = {'subtotal', 'sub total', 'total', 'tax', 'tip', 'tend', 'change', 'cash'}

# Legitimate short words that shouldn't be stripped from item name start
COMMON_SHORT_WORDS = {
    'of', 'in', 'at', 'to', 'by', 'on', 'up', 'an', 'as', 'is',
    'it', 'be', 'do', 'go', 'no', 'so', 'we', 'he', 'me', 'my',
    'bb', 'og', 'xl', 'xs', 'sm', 'lg',
}

# Compiled once — normalise common OCR character confusions
NORM_SUBS = [
    (re.compile(r'[lI|]'), '1'),
    (re.compile(r'[@oO](?=\d)'), '0'),   # only replace when adjacent to a digit
]

# Matches prices like 3.99, 12.50, 1234.00 — not preceded or followed by another digit
PRICE_RE = re.compile(r'(?<!\d)(\d{1,4}\.\d{2})(?!\d)')


# ── Helpers ───────────────────────────────────────────────────────────────────

def is_real_word(word: str) -> bool:
    return bool(get_close_matches(word.lower(), ENGLISH_WORD_SET, n=1, cutoff=0.85))


def should_ignore(word: str, cutoff: float = 0.85) -> bool:
    return bool(get_close_matches(word.strip().lower(), IGNORE_WORDS, n=1, cutoff=cutoff))


def normalize_text(text: str) -> str:
    for pattern, repl in NORM_SUBS:
        text = pattern.sub(repl, text)
    return text


def preprocess_image(img_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    # 2× upscale — gives Tesseract more pixel detail to work with
    img = cv2.resize(img, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Bilateral filter: smooths noise while preserving character edges
    gray = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)

    # Adaptive threshold handles uneven lighting/shadows far better than global Otsu
    gray = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=31,
        C=10,
    )

    # Morphological close: seals tiny breaks in character strokes without merging letters
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    gray = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, kernel)

    return gray


def clean_item_name(raw: str) -> str:
    """
    Extract a clean item label from the text to the left of a price.

    Strips:
      - Non-alphabetic characters (digits, symbols, pipe chars, etc.)
      - Trailing single-character noise ('A', 'x', etc.)
      - Leading noise tokens:
          * single characters
          * tokens with no alphabetic content
          * 2-char tokens that aren't known short English words
            (catches OCR junk like 'Zr', 'lI', 'Rm' without nuking 'of'/'in')
    """
    letters_only = re.sub(r'[^a-zA-Z\s]', '', raw)
    words = letters_only.strip().split()

    # Strip trailing single-char noise
    while words and len(words[-1]) <= 1:
        words.pop()

    # Strip leading noise tokens
    while words:
        w = words[0]
        no_alpha = not any(c.isalpha() for c in w)
        short_noise = len(w) == 2 and w.lower() not in COMMON_SHORT_WORDS
        if len(w) <= 1 or no_alpha or short_noise:
            words.pop(0)
        else:
            break

    return ' '.join(words)


# ── Core OCR logic ────────────────────────────────────────────────────────────

def process_receipt(image_bytes: bytes):
    img = preprocess_image(image_bytes)

    text     = pytesseract.image_to_string(img, config=r'--oem 3 --psm 6')
    text_norm = normalize_text(text)

    line_div      = text.split('\n')
    line_div_norm = text_norm.split('\n')

    # ── Price extraction ──────────────────────────────────────────────────────
    # Pull all candidate prices from the normalised text
    raw_prices = PRICE_RE.findall(text_norm)

    # Per line: keep only the rightmost price (that's the item total, not unit rate/qty).
    # Use (line_index, price) as the dedup key so identical prices on different lines
    # are both kept — two items can cost the same amount.
    seen: set = set()
    line_prices: list[tuple[int, str]] = []

    for idx, line in enumerate(line_div_norm):
        prices_in_line = [p for p in raw_prices if p in line]
        if prices_in_line:
            last_price = max(prices_in_line, key=lambda p: line.rfind(p))
            key = (idx, last_price)
            if key not in seen:
                seen.add(key)
                line_prices.append((idx, last_price))

    # ── Item/price pairing ────────────────────────────────────────────────────
    price_array: list[str] = []
    item_array:  list[str] = []
    total_price = tax_price = tip_price = None

    for line_idx, price in line_prices:
        orig_line = line_div[line_idx]      if line_idx < len(line_div)      else ''
        norm_line = line_div_norm[line_idx] if line_idx < len(line_div_norm) else ''
        line_lower = orig_line.lower()

        # Classify totals/tax/tip lines and skip them as items
        if any(kw in line_lower for kw in SKIP_KEYWORDS):
            if 'total' in line_lower and 'sub' not in line_lower and 'subtotal' not in line_lower:
                total_price = price
            elif 'tax' in line_lower:
                tax_price = price
            elif 'tip' in line_lower:
                tip_price = price
            continue

        # Everything left of the price position is the item label
        pos      = norm_line.find(price)
        name_raw = orig_line[:pos]
        cleaned  = clean_item_name(name_raw)

        price_array.append(price)
        item_array.append(cleaned if cleaned else f"Item {len(item_array) + 1}")

    # ── Remove ignore-list hits (reverse iteration so del stays safe) ─────────
    for s in range(len(price_array) - 1, -1, -1):
        if any(should_ignore(word) for word in item_array[s].strip().lower().split()):
            del price_array[s]
            del item_array[s]

    if not price_array:
        return None, None, None, None, None

    # ── Final display-name pass ───────────────────────────────────────────────
    # Fall back to "Item N" only if no token in the name matches a real English word
    item_button_display = []
    for a, item in enumerate(item_array):
        words = item.strip().lower().split()
        if words and any(is_real_word(w) for w in words):
            item_button_display.append(item.strip())
        else:
            item_button_display.append(f"Item {a + 1}")

    return price_array, item_button_display, total_price, tax_price, tip_price


# ── Endpoint ──────────────────────────────────────────────────────────────────

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        return {"error": "Invalid File Type"}

    try:
        contents = await file.read()
        ext       = os.path.splitext(file.filename or "")[1] or ".png"
        file_path = f"{uuid.uuid4().hex}{ext}"

        supabase.storage.from_("receipts").upload(
            file_path,
            contents,
            file_options={"content-type": file.content_type},
        )

        public_url = supabase.storage.from_("receipts").get_public_url(file_path)

        resp = requests.get(public_url, timeout=10)
        resp.raise_for_status()  # surface HTTP errors immediately

        # OCR runs before any DB writes so we don't burn IDs on a failed parse
        price_array, items, total_price, tax_price, tip_price = process_receipt(resp.content)

        party_join_code = makeCode()
        party_id        = makeID()

        supabase.table("partyMaking").insert({
            "partyID":   party_id,
            "partyRole": "Leader",
            "user":      "Leader",
        }).execute()

        if items is None:
            response = supabase.table("receipts").insert({
                "receipt_url":   public_url,
                "items":         {},
                "tax":           None,
                "partyJoinCode": party_join_code,
                "total":         None,
                "partyID":       party_id,
                "tip":           None, # Change Back To Tip Price When Included/Entered Tip Changes Made - Already On Claude
            }).execute()
            return {"warning": True, "id": response.data[0]["id"]}

        item_list = {item: price for item, price in zip(items, price_array)}

        with open("receipt.json", "w") as f:
            json.dump(item_list, f)

        response = supabase.table("receipts").insert({
            "receipt_url":   public_url,
            "items":         item_list,
            "tax":           tax_price,
            "partyJoinCode": party_join_code,
            "total":         total_price,
            "partyID":       party_id,
            "tip":           None,
        }).execute()

        return {"id": response.data[0]["id"]}

    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")






@app.post("/add-tip")
# Revised Mid Tip Changes Between Entered/Included
# Column in Supabase Also Adjusted In Type
async def add_tip(tip: float, id: int):
    response = supabase.table("receipts").select("id").eq("id", id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Receipt not found")

    supabase.table("receipts").update({"tip": float(tip)}).eq("id", id).execute()
    return {"success": True}


# @app.post("/add-tip")  
# async def update_tip(tip: int, id: int):
#     try:
#         response = (
#             supabase.table("receipts")
#             .update({"tip": tip})
#             .eq("id", id)
#             .execute()
#         )
#         return {"success": "Tip upload successfully"}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail = f"{type(e).__name__}: {e}" )
       


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