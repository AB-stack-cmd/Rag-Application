import os
import requests
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

SERPAPI_KEY = "5c523f264902e5b61c07076fb54c538bed04dfa18c9cdbf4ebdb642bfa694a29"
GEMINI_KEY = "AIzaSyDWzqUwAyAYPVt7Bv-HY6c3i77_Zd02Z2Y"


llm = ChatGoogleGenerativeAI(
    model = "gemini-2.5-flash",
    google_api_key = GEMINI_KEY
)

# content = llm.invoke(input("Enter query : ")).content

# print(content)

from langchain_google_genai import GoogleGenerativeAIEmbeddings
import getpass
import os


if not os.environ.get("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = getpass.getpass("Enter API key for Google Gemini: ")

embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
vector = embeddings.embed_query("hello, world!")
v=vector[:5]
print(v)