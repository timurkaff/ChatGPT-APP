import eel
from duckduckgo_search import DDGS

eel.init('web')

memory = []

@eel.expose
def search_with_duckduckgo(prompt):
    global memory

    full_prompt = ""
    for item in memory:
        full_prompt += f"User: {item['prompt']}\nBot: {item['response']}\n"
    full_prompt += f"User: {prompt}\n"

    with DDGS() as ddgs:
        results = ddgs.chat(full_prompt)
        
        memory.append({"prompt": prompt, "response": results})
        
        return results

eel.start('index.html', size=(1200, 800))
