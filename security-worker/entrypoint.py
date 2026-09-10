#!/usr/bin/env python3
import sys
import json
import subprocess
import time
import os
from typing import Dict, Any

# Ensure local parsers directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from parsers.nmap_parser import NmapParser
from parsers.dns_http_parsers import DNSParser, HTTPParser

PROFILES_PATH = os.path.join(os.path.dirname(__file__), "config", "profiles.json")

def load_profiles() -> Dict[str, Any]:
    if os.path.exists(PROFILES_PATH):
        with open(PROFILES_PATH, "r") as f:
            return json.load(f)
    return {}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No execution JSON payload provided"}))
        sys.exit(1)

    try:
        payload = json.loads(sys.argv[1])
    except Exception as e:
        print(json.dumps({"error": f"Invalid JSON payload: {str(e)}"}))
        sys.exit(1)

    tool = payload.get("tool")
    profile_name = payload.get("profile")
    target = payload.get("target")
    options = payload.get("options", {})

    profiles = load_profiles()
    tool_profiles = profiles.get(tool, {})
    profile = tool_profiles.get(profile_name)

    if not profile:
        print(json.dumps({"error": f"Profile '{profile_name}' not found for tool '{tool}'"}))
        sys.exit(1)

    template = profile["command_template"]
    ports = options.get("ports") or profile.get("default_ports", "80,443,8080,22,5432")

    # Construct safe command from template
    cmd = []
    for arg in template:
        cmd.append(arg.replace("{target}", target).replace("{ports}", ports))

    start_time = time.time()
    try:
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=profile.get("timeout", 120)
        )
        duration = round(time.time() - start_time, 2)
        stdout = proc.stdout
        stderr = proc.stderr
        exit_code = proc.returncode
    except subprocess.TimeoutExpired:
        duration = round(time.time() - start_time, 2)
        print(json.dumps({
            "exit_code": -1,
            "duration": duration,
            "stdout": "",
            "stderr": "Execution timed out",
            "parsed_result": None,
            "error": "TIMEOUT"
        }))
        sys.exit(0)
    except FileNotFoundError:
        duration = round(time.time() - start_time, 2)
        print(json.dumps({
            "exit_code": -1,
            "duration": duration,
            "stdout": "",
            "stderr": f"Required binary '{cmd[0]}' not installed in this environment.",
            "parsed_result": None,
            "error": f"TOOL_NOT_INSTALLED: {cmd[0]}"
        }))
        sys.exit(0)
    except Exception as e:
        duration = round(time.time() - start_time, 2)
        print(json.dumps({
            "exit_code": -1,
            "duration": duration,
            "stdout": "",
            "stderr": str(e),
            "parsed_result": None,
            "error": str(e)
        }))
        sys.exit(0)

    # Parse Output
    parser_type = profile.get("parser")
    parsed_result = None
    if parser_type == "nmap_xml":
        parsed_result = NmapParser.parse_xml(stdout)
    elif parser_type == "dig_text":
        parsed_result = DNSParser.parse_dig_output(stdout, target)
    elif parser_type == "http_headers":
        parsed_result = HTTPParser.parse_header_output(stdout, target)
    else:
        parsed_result = {"raw": stdout}

    output_payload = {
        "exit_code": exit_code,
        "duration": duration,
        "stdout": stdout,
        "stderr": stderr,
        "parsed_result": parsed_result,
        "error": None if exit_code == 0 else f"Process exited with status code {exit_code}"
    }

    print(json.dumps(output_payload))

if __name__ == "__main__":
    main()
