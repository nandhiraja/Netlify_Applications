from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/menu")
def get_menu():
    with open("data.json", "r") as file:
        data = json.load(file)
    return data
@app.get("/category")
def get_menu():
    with open("Category.json", "r") as file:
        data = json.load(file)
    return data
