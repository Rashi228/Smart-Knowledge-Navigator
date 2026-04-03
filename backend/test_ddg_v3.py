import os
from dotenv import load_dotenv
from duckduckgo_search import DDGS

load_dotenv()

def test_ddg():
    query = "top 10 news of today"
    print(f"Testing DDG for: {query}")
    try:
        # Latest usage based on common patterns
        with DDGS() as ddgs:
            results = [r for r in ddgs.text(query, max_results=5)]
            print(f"Result count: {len(results)}")
            for r in results:
                print(f"- {r['href']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_ddg()
