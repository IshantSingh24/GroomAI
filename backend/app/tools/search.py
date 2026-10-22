from agents import function_tool
import requests
import os

@function_tool
def serper_search(query: str) -> list:
    """
    Search Indian grooming products, prices (INR / Rs), and price comparisons
    on Indian e-commerce platforms like Buyhatke (preferred for cross-platform price comparisons),
    Amazon India, Flipkart, etc. using Google Serper.
    """
    api_key = os.getenv("SERPER_API_KEY")
    if not api_key:
        raise RuntimeError("SERPER_API_KEY not set")

    url = "https://google.serper.dev/search"
    headers = {
        "X-API-KEY": api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "q": query,
        "gl": "in",
        "hl": "en",
        "num": 5,
    }

    r = requests.post(url, headers=headers, json=payload, timeout=10)
    r.raise_for_status()

    organic = r.json().get("organic", [])

    return [
        {
            "title": item.get("title", ""),
            "url": item.get("link", ""),
            "snippet": item.get("snippet", ""),
        }
        for item in organic
    ]
