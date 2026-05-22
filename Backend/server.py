import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

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
        os.makedirs("uploads", exist_ok=True)  
        with open("uploads/image.png", "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))  
    finally:
        await file.close()
    
    return {"message": f"Successfully uploaded {file.filename}"}