import xml.etree.ElementTree as ET
from typing import Dict, Any, List, Optional

class NmapParser:
    @staticmethod
    def parse_xml(xml_content: str) -> Dict[str, Any]:
        if not xml_content or not xml_content.strip():
            return {"target": "", "hosts": [], "raw_parsed": False}

        try:
            root = ET.fromstring(xml_content.strip())
        except ET.ParseError as e:
            return {"target": "", "hosts": [], "error": f"Invalid XML output: {str(e)}", "raw_parsed": False}

        hosts_data: List[Dict[str, Any]] = []

        for host in root.findall("host"):
            # Address & Status
            status_elem = host.find("status")
            status = status_elem.attrib.get("state", "unknown") if status_elem is not None else "unknown"

            address_elem = host.find("address")
            address = address_elem.attrib.get("addr", "") if address_elem is not None else ""

            # Hostnames
            hostnames = []
            hostnames_elem = host.find("hostnames")
            if hostnames_elem is not None:
                for hn in hostnames_elem.findall("hostname"):
                    name = hn.attrib.get("name")
                    if name:
                        hostnames.append(name)

            # Ports & Services
            ports_data = []
            ports_elem = host.find("ports")
            if ports_elem is not None:
                for port in ports_elem.findall("port"):
                    port_id = int(port.attrib.get("portid", 0))
                    protocol = port.attrib.get("protocol", "tcp")

                    state_elem = port.find("state")
                    port_state = state_elem.attrib.get("state", "unknown") if state_elem is not None else "unknown"

                    service_elem = port.find("service")
                    service_name = service_elem.attrib.get("name", "unknown") if service_elem is not None else "unknown"
                    product = service_elem.attrib.get("product") if service_elem is not None else None
                    version = service_elem.attrib.get("version") if service_elem is not None else None
                    extrainfo = service_elem.attrib.get("extrainfo") if service_elem is not None else None

                    # Extract CPEs
                    cpes = []
                    if service_elem is not None:
                        for cpe in service_elem.findall("cpe"):
                            if cpe.text:
                                cpes.append(cpe.text)

                    ports_data.append({
                        "port": port_id,
                        "protocol": protocol,
                        "state": port_state,
                        "service": service_name,
                        "product": product,
                        "version": version,
                        "extrainfo": extrainfo,
                        "cpes": cpes
                    })

            hosts_data.append({
                "address": address,
                "hostnames": hostnames,
                "status": status,
                "ports": ports_data
            })

        main_target = hosts_data[0]["address"] if hosts_data else ""
        return {
            "target": main_target,
            "hosts": hosts_data,
            "raw_parsed": True
        }
