from agents import Runner
from agent import agent

def run(prompt):
    print(f"\nUSER: {prompt}")
    result = Runner.run_sync(agent, prompt)
    print("AGENT:", result.final_output)

if __name__ == "__main__":
    run("Add Cetaphil cleanser for 349 rupees for daily face wash")
    run("Add sunscreen for 499 because sun protection")
    run("List all items")
    run("Delete Cetaphil cleanser")
    run("List all items")
