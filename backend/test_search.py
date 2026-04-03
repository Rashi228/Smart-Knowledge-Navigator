import os
from dotenv import load_dotenv
from firecrawl import FirecrawlApp
from duckduckgo_search import DDGS

load_dotenv()

def test_search():
    query = "top 10 news of today"
    
    print(f"Testing search for: {query}")
    
    # 1. Test Firecrawl
    firecrawl_key = os.getenv("FIRE_CRAWL_API_KEY")
    if firecrawl_key:
        print(f"Firecrawl Key Found: {firecrawl_key[:5]}...")
        try:
            app = FirecrawlApp(api_key=firecrawl_key)
            result = app.search(query, params={"limit": 2})
            print(f"Firecrawl Result Received: {bool(result)}")
            if result and "data" in result:
                print(f"Firecrawl Data Count: {len(result['data'])}")
                for r in result["data"]:
                    print(f"Source: {r.get('url')}")
            else:
                print("Firecrawl returned no data.")
        except Exception as e:
            print(f"Firecrawl Error: {e}")
    else:
        print("Firecrawl Key Not Found.")

    # 2. Test DDG
    print("\nTesting DuckDuckGo...")
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=3))
            print(f"DDG Result Count: {len(results)}")
            for r in results:
                print(f"Source: {r['href']}")
    except Exception as e:
        print(f"DDG Error: {e}")

if __name__ == "__main__":
    test_search()
