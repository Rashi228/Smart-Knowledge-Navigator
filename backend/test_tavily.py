import os
from dotenv import load_dotenv
from tavily import TavilyClient

load_dotenv()

def test_tavily_search():
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        print("Error: TAVILY_API_KEY not found in .env")
        return

    print(f"Testing Tavily with query: 'latest news today'")
    try:
        tavily = TavilyClient(api_key=api_key)
        response = tavily.search(query="latest news today", search_depth="advanced", max_results=3)
        if response and "results" in response:
            print(f"Success! Found {len(response['results'])} results.")
            for r in response["results"]:
                print(f"- {r.get('title')}: {r.get('url')}")
        else:
            print("Failure: Response format unexpected or empty.")
    except Exception as e:
        print(f"Error during Tavily search: {e}")

if __name__ == "__main__":
    test_tavily_search()
