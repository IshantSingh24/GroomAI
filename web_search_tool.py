from agents import function_tool
import requests
import os

@function_tool()
def serper_search(query: str) -> list:
    """
    Performs a Serper API search and returns a list of results.
    """
    api_key = os.getenv("SERPER_API_KEY")
    url = "https://google.serper.dev/search"
    headers = {"X-API-KEY": api_key, "Content-Type": "application/json"}
    payload = {"q": query, "num": 5}

    r = requests.post(url, headers=headers, json=payload)
    r.raise_for_status()

    organic = r.json().get("organic", [])

    return [
        {
            "title": item.get("title", ""),
            "url": item.get("link", ""),
            "snippet": item.get("snippet", "")
        }
        for item in organic
    ]
