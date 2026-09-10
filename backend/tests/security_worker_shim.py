import importlib.util, os
_p = os.path.join(os.path.dirname(__file__), "..", "..", "security-worker", "parsers", "nmap_parser.py")
_spec = importlib.util.spec_from_file_location("nmap_parser", os.path.abspath(_p))
_m = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_m)
NmapParser = _m.NmapParser
