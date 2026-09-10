"""
CyberAgents — Controlled Package Catalog & Tool Manager Policy
---------------------------------------------------------------
Defines approved core preinstalled tools and catalog of installable on-demand packages.
Package installation is strictly restricted to approved packages in this catalog.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel


class ToolPackageSpec(BaseModel):
    package_name: str
    display_name: str
    description: str
    category: str  # Core | Networking | Diagnostics | Development | Security Assessment | Utilities
    executable: str
    version_cmd: str
    is_core: bool = False
    requires_approval: bool = True
    apt_package: str
    pip_package: Optional[str] = None


# Authoritative Approved Package Catalog
APPROVED_PACKAGE_CATALOG: Dict[str, ToolPackageSpec] = {
    # ─── CORE PREINSTALLED TOOLS ──────────────────────────────────────────────────
    "dig": ToolPackageSpec(
        package_name="dig",
        display_name="Dig (DNS Lookup Utility)",
        description="DNS lookup tool for querying Domain Name System name servers.",
        category="Networking",
        executable="dig",
        version_cmd="dig -v 2>&1 | head -1",
        is_core=True,
        requires_approval=False,
        apt_package="bind9-dnsutils",
    ),
    "nmap": ToolPackageSpec(
        package_name="nmap",
        display_name="Nmap Security Scanner",
        description="Network exploration tool and security / port scanner.",
        category="Security Assessment",
        executable="nmap",
        version_cmd="nmap --version | head -1",
        is_core=True,
        requires_approval=False,
        apt_package="nmap",
    ),
    "nslookup": ToolPackageSpec(
        package_name="nslookup",
        display_name="Nslookup",
        description="Name server lookup tool for querying domain name system records.",
        category="Networking",
        executable="nslookup",
        version_cmd="nslookup -version 2>&1 | head -1",
        is_core=True,
        requires_approval=False,
        apt_package="dnsutils",
    ),
    "ping": ToolPackageSpec(
        package_name="ping",
        display_name="Ping ICMP Utility",
        description="Send ICMP ECHO_REQUEST packets to network hosts.",
        category="Diagnostics",
        executable="ping",
        version_cmd="ping -V 2>&1 || ping --version 2>&1 | head -1",
        is_core=True,
        requires_approval=False,
        apt_package="iputils-ping",
    ),
    "which": ToolPackageSpec(
        package_name="which",
        display_name="Which Binary Resolver",
        description="Locate command executables in PATH.",
        category="Utilities",
        executable="which",
        version_cmd="which --version 2>&1 | head -1",
        is_core=True,
        requires_approval=False,
        apt_package="debianutils",
    ),
    "curl": ToolPackageSpec(
        package_name="curl",
        display_name="cURL HTTP Client",
        description="Command line tool for transferring data with URL syntax.",
        category="Networking",
        executable="curl",
        version_cmd="curl --version | head -1",
        is_core=True,
        requires_approval=False,
        apt_package="curl",
    ),
    "nc": ToolPackageSpec(
        package_name="nc",
        display_name="Netcat (nc)",
        description="TCP/IP Swiss army knife for reading and writing network connections.",
        category="Networking",
        executable="nc",
        version_cmd="nc -h 2>&1 | head -1",
        is_core=True,
        requires_approval=False,
        apt_package="netcat-openbsd",
    ),

    # ─── ON-DEMAND INSTALLABLE UTILITIES ──────────────────────────────────────────
    "jq": ToolPackageSpec(
        package_name="jq",
        display_name="jq JSON Processor",
        description="Lightweight and flexible command-line JSON processor.",
        category="Utilities",
        executable="jq",
        version_cmd="jq --version 2>&1",
        is_core=False,
        requires_approval=True,
        apt_package="jq",
    ),
    "git": ToolPackageSpec(
        package_name="git",
        display_name="Git Version Control",
        description="Distributed version control system for tracking code changes.",
        category="Development",
        executable="git",
        version_cmd="git --version 2>&1",
        is_core=False,
        requires_approval=True,
        apt_package="git",
    ),
    "tree": ToolPackageSpec(
        package_name="tree",
        display_name="Tree Directory Viewer",
        description="Recursive directory listing program producing a depth-indented file list.",
        category="Utilities",
        executable="tree",
        version_cmd="tree --version 2>&1",
        is_core=False,
        requires_approval=False,
        apt_package="tree",
    ),
    "vim": ToolPackageSpec(
        package_name="vim",
        display_name="Vim Text Editor",
        description="Highly configurable text editor built to enable efficient text editing.",
        category="Utilities",
        executable="vim",
        version_cmd="vim --version | head -1",
        is_core=False,
        requires_approval=False,
        apt_package="vim-tiny",
    ),
    "nano": ToolPackageSpec(
        package_name="nano",
        display_name="GNU Nano Editor",
        description="Simple, user-friendly command-line text editor.",
        category="Utilities",
        executable="nano",
        version_cmd="nano --version | head -1",
        is_core=False,
        requires_approval=False,
        apt_package="nano",
    ),
    "iproute2": ToolPackageSpec(
        package_name="iproute2",
        display_name="IPRoute2 (ip / ss)",
        description="Networking tools for managing IP interfaces, routing tables, and sockets.",
        category="Diagnostics",
        executable="ip",
        version_cmd="ip -V 2>&1",
        is_core=False,
        requires_approval=True,
        apt_package="iproute2",
    ),
    "tcpdump": ToolPackageSpec(
        package_name="tcpdump",
        display_name="TCPDump Packet Analyzer",
        description="Command-line packet analyzer for capturing network traffic.",
        category="Diagnostics",
        executable="tcpdump",
        version_cmd="tcpdump --version 2>&1 | head -1",
        is_core=False,
        requires_approval=True,
        apt_package="tcpdump",
    ),
    "htop": ToolPackageSpec(
        package_name="htop",
        display_name="Htop Process Monitor",
        description="Interactive process viewer and system monitor.",
        category="Diagnostics",
        executable="htop",
        version_cmd="htop --version | head -1",
        is_core=False,
        requires_approval=False,
        apt_package="htop",
    ),
    "python3-pip": ToolPackageSpec(
        package_name="python3-pip",
        display_name="Python Pip Package Installer",
        description="The PyPA recommended tool for installing Python packages.",
        category="Development",
        executable="pip3",
        version_cmd="pip3 --version 2>&1",
        is_core=False,
        requires_approval=True,
        apt_package="python3-pip",
    ),
}


class PackageCatalogManager:
    @staticmethod
    def get_catalog() -> Dict[str, ToolPackageSpec]:
        return APPROVED_PACKAGE_CATALOG

    @staticmethod
    def get_package(name: str) -> Optional[ToolPackageSpec]:
        return APPROVED_PACKAGE_CATALOG.get(name.lower())

    @staticmethod
    def is_approved(name: str) -> bool:
        return name.lower() in APPROVED_PACKAGE_CATALOG


package_catalog = PackageCatalogManager()
