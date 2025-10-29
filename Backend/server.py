from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import requests



# data  =  requests.get("https://4351c8539fe4.ngrok-free.app/menu/categories")
# print(data.json())

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
        print(data)
    return data
@app.get("/menu/categories")
def get_menu():
    with open("Category.json", "r") as file:
        data = json.load(file)
        # print(data, type(data))
    return data
@app.get("/menu/categories/{category_id}/items")
def get_items_by_category(category_id: int):
    with open("data.json", "r") as file:
        data = json.load(file)
    # Filter items by category_id
    items = [item for item in data["menuItems"] if item["category_id"] == category_id]
    return {"menuItems": items}