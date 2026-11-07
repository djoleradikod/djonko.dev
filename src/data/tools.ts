// Catalogue of publicly available tools for VCF 9.x, shown at /vcf/tools/.
//
// Rules for entries:
// - Link to the publisher's own page. Nothing is rehosted or mirrored here.
// - Publicly available only. Tools and repositories that are not public are never listed, even when a
//   public page mentions them.
// - Describe in our own words what the tool does and what to know before using it.
// - `checked` is the date the links and facts were last confirmed against the source.
//   scripts/check-external.mjs re-checks every link weekly in CI.

export type Job = 'plan' | 'deploy' | 'upgrade' | 'diagnose' | 'operate' | 'automate' | 'lab';
export type Maker = 'broadcom' | 'fling' | 'opensource' | 'vendor' | 'community' | 'commercial';

export type Tool = {
  name: string;
  job: Job;
  maker: Maker;
  publisher: string;
  /** VCF versions the publisher states the tool supports. Empty when the publisher does not say. */
  versions: string[];
  what: string;
  /** What to know before running it: support status, side effects, prerequisites. */
  know?: string;
  get: { label: string; url: string };
  docs?: { label: string; url: string }[];
  kbs?: number[];
  checked: string;
};

export const JOBS: { id: Job; title: string; blurb: string }[] = [
  { id: 'plan', title: 'Plan and size', blurb: 'Upgrade paths, interoperability, hardware compatibility and sizing, before anything is deployed or changed.' },
  { id: 'deploy', title: 'Deploy and get binaries', blurb: 'Install a new fleet, bring an existing vSphere estate under VCF, and stage binaries for connected or air-gapped sites.' },
  { id: 'upgrade', title: 'Upgrade readiness', blurb: 'Checks to run before an upgrade window, and the clean-up tools for the depot problems that block one.' },
  { id: 'diagnose', title: 'Diagnose and repair', blurb: 'Read-only diagnostic tools first. The certificate repair tools change the system and are run with Broadcom Support.' },
  { id: 'operate', title: 'Operate and monitor', blurb: 'Extending VCF Operations to systems it does not cover out of the box, and reporting on platform health.' },
  { id: 'automate', title: 'Automate', blurb: 'Supported SDKs, PowerShell, Terraform and Ansible, and the API specifications they are built from.' },
  { id: 'lab', title: 'Lab and learning', blurb: 'Nested VCF for testing and training, and the reference material that goes with it.' },
];

export const MAKERS: Record<Maker, { label: string; note: string }> = {
  broadcom: { label: 'Broadcom', note: 'Part of the product or published by Broadcom. Supported under a normal support contract unless the entry says otherwise.' },
  fling: { label: 'Fling', note: 'Free Broadcom engineering tool. Not covered by product support; feedback goes through the Flings community.' },
  opensource: { label: 'VMware open source', note: 'Open-source project under the VMware GitHub organisation. Issues are handled on GitHub.' },
  vendor: { label: 'Other vendor', note: 'Free tool published by another company. Supported, if at all, by that company.' },
  community: { label: 'Community', note: 'Written by an individual in the community. Not affiliated with Broadcom. Check the result against official documentation.' },
  commercial: { label: 'Commercial', note: 'Third-party product with a paid licence. Listed for completeness, not endorsed.' },
};

const C = '2026-11-02';

export const TOOLS: Tool[] = [
  // Plan and size
  {
    name: 'VCF 9.1 Upgrade Planning Tool', job: 'plan', maker: 'broadcom', publisher: 'Broadcom (VMware GitHub Pages)', versions: ['5.x', '9.0', '9.1'],
    what: 'A browser-based planner. You describe the current estate (version, topology, add-ons) and it produces an ordered upgrade path to 9.1, with the prerequisites for each step. Later releases added 9.1.1 and express-patch paths, a VKS planner, and export of the plan to text or Markdown.',
    know: 'Runs in the browser and needs no access to the environment. Treat the output as a draft runbook: confirm each step against the release notes and the interoperability matrix.',
    get: { label: 'Open the planner', url: 'https://vmware.github.io/vcf-upgrade-planner/' },
    docs: [
      { label: 'Announcement', url: 'https://blogs.vmware.com/cloud-foundation/2026/05/28/announcing-the-vmware-cloud-foundation-9-1-upgrade-planning-tool/' },
      { label: 'Issues and feedback', url: 'https://github.com/vmware/vcf-upgrade-planner' },
    ],
    checked: C,
  },
  {
    name: 'Broadcom Interoperability Matrix', job: 'plan', maker: 'broadcom', publisher: 'Broadcom', versions: ['5.x', '9.0', '9.1'],
    what: 'Which versions of VCF components, and of other Broadcom products, are supported together, and which upgrade paths between versions are supported.',
    know: 'Check it for every component that integrates with VCF, not only the core stack: backup, monitoring and any product that talks to vCenter or NSX.',
    get: { label: 'Open the matrix', url: 'https://interopmatrix.broadcom.com/Interoperability' },
    checked: C,
  },
  {
    name: 'Broadcom Compatibility Guide', job: 'plan', maker: 'broadcom', publisher: 'Broadcom', versions: ['5.x', '9.0', '9.1'],
    what: 'Certified hardware for ESX and vSAN: servers, I/O controllers, NICs, drives and vSAN ReadyNodes. The successor to the VMware Compatibility Guide.',
    know: 'VCF deployment and upgrade prechecks validate hosts against this data. Look up drivers and firmware for the target ESX release before the window, not during it.',
    get: { label: 'Open the guide', url: 'https://compatibilityguide.broadcom.com/' },
    docs: [
      { label: 'vSAN ESA ReadyNode hardware guidance', url: 'https://compatibilityguide.broadcom.com/pages/vsan-esa-readynode-hardware-guidance' },
      { label: 'Verifying compatibility for VCF on vSAN', url: 'https://blogs.vmware.com/cloud-foundation/2024/11/20/verifying-compatibility-for-vmware-cloud-foundation-environments-powered-by-vsan/' },
    ],
    kbs: [326717],
    checked: C,
  },
  {
    name: 'vSAN ReadyNode Sizer', job: 'plan', maker: 'broadcom', publisher: 'Broadcom', versions: ['5.x', '9.0', '9.1'],
    what: 'Sizes vSAN clusters from workload profiles: host count, capacity after protection overhead, and ReadyNode configurations that fit.',
    get: { label: 'Open the sizer', url: 'https://vsansizer.esp.vmware.com/home' },
    checked: C,
  },
  {
    name: 'VCF Operations sizing', job: 'plan', maker: 'broadcom', publisher: 'Broadcom', versions: ['9.0', '9.1'],
    what: 'Two calculators and a sizing KB. The Operations sizer picks node size and count from object and metric counts; the logs sizer does the same for VCF Operations for Logs from ingestion rate and retention.',
    know: 'The KB also covers continuous-availability clusters and cloud proxy sizing, and attaches a sizing spreadsheet.',
    get: { label: 'Operations sizer', url: 'https://vropssizer.broadcom.com/' },
    docs: [{ label: 'Logs sizer', url: 'https://vrlisizer.broadcom.com/' }],
    kbs: [397782],
    checked: C,
  },
  {
    name: 'VCF Upgrade Path Planner (vmtechie)', job: 'plan', maker: 'community', publisher: 'vmtechie.blog', versions: ['4.x', '5.x', '9.0'],
    what: 'A community web planner for major upgrades from vSphere 7 and 8, or VCF 4.x and 5.x, to VCF 9.0. It produces a roadmap with prerequisites, KB references and time estimates.',
    know: 'Targets 9.0, not 9.1. For 9.1 use the Broadcom planner above. The page states it is independent of Broadcom.',
    get: { label: 'Open the planner', url: 'https://avnish80.github.io/vcf-upgrade-planner' },
    checked: C,
  },
  {
    name: 'RVTools', job: 'plan', maker: 'vendor', publisher: 'Dell Technologies', versions: [],
    what: 'A Windows application that exports a vCenter inventory (VMs, hosts, datastores, networks, snapshots, tools versions) to spreadsheets. The usual first step of an assessment or migration plan.',
    know: 'Check the release notes for the vCenter versions supported before running it against a 9.x vCenter. A read-only vCenter account is enough.',
    get: { label: 'Download from Dell', url: 'https://www.dell.com/en-us/shop/vmware/sl/rvtools' },
    checked: C,
  },
  {
    name: 'VCF Designer', job: 'plan', maker: 'commercial', publisher: 'VCF Designer (third party)', versions: ['9.0', '9.1'],
    what: 'A browser-based design tool for VCF 9.x. It imports planning workbooks and RVTools exports, validates a design against VCF 9.0 and 9.1 rules, sizes domains, and exports design documents and diagrams.',
    know: 'Paid subscription with a free trial. Not affiliated with Broadcom.',
    get: { label: 'Product page', url: 'https://vcfdesigner-landing.pages.dev/' },
    checked: C,
  },

  // Deploy and get binaries
  {
    name: 'VCF Installer', job: 'deploy', maker: 'broadcom', publisher: 'Broadcom', versions: ['9.0', '9.1'],
    what: 'The appliance that deploys a new VCF or VVF fleet in 9.x, replacing Cloud Builder. It also converges an existing vSphere environment into VCF. It can run its validations on its own, against an existing environment, without deploying anything.',
    know: 'Running the prechecks alone needs only the appliance and a connected online or offline depot; checks that depend on binaries fail until they are downloaded. Since 9.1, binary downloads use an activation code instead of a download token.',
    get: { label: 'Deployment troubleshooting (9.1 docs)', url: 'https://techdocs.broadcom.com/us/en/vmware-cis/vcf/vcf-9-0-and-later/9-1/deployment/deploying-a-new-vmware-cloud-foundation-or-vmware-vsphere-foundation-private-cloud-/troubleshooting-vmware-cloud-foundation-or-vmware-vsphere-foundation-deployments.html' },
    docs: [
      { label: 'Converge vSphere to VCF 9.0', url: 'https://blogs.vmware.com/cloud-foundation/2026/02/05/how-to-converge-a-vmware-vsphere-environment-to-vmware-cloud-foundation-9-0/' },
      { label: 'Using the installer as a pre-check tool', url: 'https://williamlam.com/2026/05/vcf-9-1-quick-tip-using-the-vcf-installer-as-a-standalone-pre-check-tool.html' },
    ],
    kbs: [443647, 401497],
    checked: C,
  },
  {
    name: 'VCF Download Tool (VCFDT)', job: 'deploy', maker: 'broadcom', publisher: 'Broadcom', versions: ['5.2', '9.0', '9.1'],
    what: 'Command-line tool that downloads install and upgrade binaries into an offline depot, for sites where the installer and SDDC Manager cannot reach the internet. In 9.1 it also downloads ESX patches, which removes the need for UMDS.',
    know: 'Register the depot at vcf.broadcom.com to get an activation code; ESX downloads require one. Day-N components such as log management and Operations for networks are downloaded by component ID.',
    get: { label: 'What is the VCF Download Tool (9.1 docs)', url: 'https://techdocs.broadcom.com/us/en/vmware-cis/vcf/vcf-9-0-and-later/9-1/lifecycle-management/binary-management-for-vmware-cloud-foundation/what-is-the-vcf-download-tool-.html' },
    docs: [{ label: 'Command cheat sheet (William Lam)', url: 'https://williamlam.com/2026/05/vcf-9-1-vcf-download-tool-vcfdt-cheatsheet.html' }],
    kbs: [451834, 420338, 442857],
    checked: C,
  },

  // Upgrade readiness
  {
    name: 'VCF Inspector', job: 'upgrade', maker: 'fling', publisher: 'Broadcom (Fling)', versions: ['9.1'],
    what: 'A standalone diagnostic tool for VCF 9.1 and the management services. It reports upgrade readiness, reconstructs a timeline of past deployments and upgrades, and checks day-2 health. Builds for macOS, Windows and Linux.',
    know: 'Needs network access on ports 22, 443, 5480 and 6443, and either the vmware-system-user account or SDDC Manager administrator credentials. Fling: no product support.',
    get: { label: 'Download (Broadcom Support Portal, free)', url: 'https://support.broadcom.com/group/ecx/productfiles?subFamily=Flings&displayGroup=VCF%20Inspector&release=1.400&os=&servicePk=&language=EN&freeDownloads=true' },
    docs: [{ label: 'Announcement', url: 'https://blogs.vmware.com/cloud-foundation/2026/07/28/vcf-inspector-fling/' }],
    checked: C,
  },
  {
    name: 'SoS utility', job: 'upgrade', maker: 'broadcom', publisher: 'Broadcom (built into SDDC Manager)', versions: ['5.x', '9.0', '9.1'],
    what: 'The supportability tool on SDDC Manager. `sos --health-check` checks the components SDDC Manager manages, and on 5.x and 9.0.x it fails on active locks; other options collect log bundles for support. The 9.1 upgrade-readiness KB pairs it with VDT on each vCenter.',
    know: 'Run as root on SDDC Manager from /opt/vmware/sddc-support/sos. Health checks are read-only; log collection writes bundles to disk, so check free space first.',
    get: { label: 'Health checks for 9.1 upgrade readiness', url: 'https://knowledge.broadcom.com/external/article/454898' },
    kbs: [454898, 439473, 385749],
    checked: C,
  },
  {
    name: 'Bundle Cleanup Utility', job: 'upgrade', maker: 'broadcom', publisher: 'Broadcom (built into SDDC Manager)', versions: ['5.x', '9.0'],
    what: 'A script on SDDC Manager, bundle_cleanup.py, that removes old install and upgrade bundles from the bundle partition, for prechecks that fail on disk space.',
    know: 'In 9.x, delete binaries from the UI first and use the script only when that fails. Snapshot SDDC Manager before running it. Deleted bundles must be downloaded again if needed, and their upgrade history is removed.',
    get: { label: 'How to use the Bundle Cleanup Utility', url: 'https://knowledge.broadcom.com/external/article/312173' },
    kbs: [312173, 447248],
    checked: C,
  },
  {
    name: 'Fleet depot cache cleanup script', job: 'upgrade', maker: 'broadcom', publisher: 'Broadcom (KB attachment)', versions: ['9.1'],
    what: 'A script attached to a KB that clears the local cache of the 9.1 fleet depot service, for binary downloads or deletions that fail on a checksum mismatch.',
    get: { label: 'KB with the script', url: 'https://knowledge.broadcom.com/external/article/444900/clearing-the-bundle-cache-on-vcf-91-flee.html' },
    kbs: [444900],
    checked: C,
  },

  // Diagnose and repair
  {
    name: 'VCF Diagnostic Tool for vSphere (VDT)', job: 'diagnose', maker: 'broadcom', publisher: 'Broadcom (KB attachment)', versions: ['5.x', '9.0', '9.1'],
    what: 'Python scripts that run on the vCenter appliance and report PASS, WARN and FAIL for known configuration problems: SSO and lookup service, certificates, VMdir, DNS, NTP, disk, database size, services and identity sources.',
    know: 'Read-only, and it records no passwords. Use a release without the _beta suffix if a beta build misbehaves. Check the KB for the current version; the same package also has modes for SDDC Manager and VKS.',
    get: { label: 'Download from the KB', url: 'https://knowledge.broadcom.com/external/article/344917' },
    kbs: [344917],
    checked: C,
  },
  {
    name: 'VDT for SDDC Manager', job: 'diagnose', maker: 'broadcom', publisher: 'Broadcom (KB attachment)', versions: ['5.x', '9.0', '9.1'],
    what: 'The VDT checks for SDDC Manager: its certificates and those of vCenter and NSX, inventory state, disk, NFS permissions, failed password tasks, manifest and depot, and locks.',
    know: 'Read-only. Marked beta. Prompts for the SSO administrator password; without it only the unauthenticated checks run.',
    get: { label: 'How to run it', url: 'https://knowledge.broadcom.com/external/article/314610/using-the-vcf-diagnostic-tool-for-sddc-m.html' },
    kbs: [314610],
    checked: C,
  },
  {
    name: 'VDT for VKS', job: 'diagnose', maker: 'broadcom', publisher: 'Broadcom (KB attachment)', versions: ['5.x', '9.0', '9.1'],
    what: 'The VDT checks for vSphere Kubernetes Service. It runs on the vCenter appliance and connects to the Supervisor nodes over SSH.',
    know: 'Read-only. Marked beta. Run with `python vdt.py -p vks`; set SUPERVISOR_NAME when there is more than one Supervisor.',
    get: { label: 'How to run it', url: 'https://knowledge.broadcom.com/external/article/402184/using-the-vcf-diagnostic-tool-for-vspher.html' },
    kbs: [402184],
    checked: C,
  },
  {
    name: 'vCert', job: 'diagnose', maker: 'broadcom', publisher: 'Broadcom (KB attachment)', versions: ['5.x', '9.0', '9.1'],
    what: 'A menu-driven script for vCenter certificates: health checks, replacement of Machine SSL, solution user, STS signing and VMCA certificates, clean-up of trusted roots, and ESX host certificates.',
    know: 'Changes the system. Intended for use with Broadcom Support. Take offline snapshots or file-based backups of every vCenter in the SSO domain first. Replacing the STS signing certificate invalidates scheduled tasks.',
    get: { label: 'Download from the KB', url: 'https://knowledge.broadcom.com/external/article/385107' },
    kbs: [385107],
    checked: C,
  },
  {
    name: 'VCF certificate tool (vcf-cert-tool)', job: 'diagnose', maker: 'broadcom', publisher: 'Broadcom (Support Portal download)', versions: ['5.2', '9.0', '9.1'],
    what: 'One menu-driven tool for expired or broken internal certificates across vCenter, ESX, NSX, the Supervisor, VCF Operations and the cloud proxy. It brings together workflows that used to need vCert, CARR and certmgr separately.',
    know: 'Changes the system. Use only under the direction of Broadcom Support, after backups. Replacing a certificate does not update the trust that other components hold; those may need a separate refresh. Download from the VCF 9 Drivers & Tools tab.',
    get: { label: 'KB with download steps', url: 'https://knowledge.broadcom.com/external/article/445742' },
    kbs: [445742],
    checked: C,
  },

  // Operate and monitor
  {
    name: 'Management Pack Builder', job: 'operate', maker: 'broadcom', publisher: 'Broadcom (built into VCF Operations)', versions: ['9.0', '9.1'],
    what: 'Builds VCF Operations management packs without code: point it at a REST API, map the responses to objects, metrics and properties, and install the result as an adapter. In 9.x it is under Build, Developer Center.',
    know: 'After upgrading VCF Operations to 9.1.1, packs built with an earlier MP Builder stop collecting until each design is reopened and reinstalled from the updated builder.',
    get: { label: 'Overview', url: 'https://blogs.vmware.com/cloud-foundation/2026/02/04/extending-visibility-with-vmware-cloud-foundations-management-pack-builder/' },
    kbs: [454434],
    checked: C,
  },
  {
    name: 'VMware.CloudFoundation.Reporting', job: 'operate', maker: 'opensource', publisher: 'VMware (GitHub)', versions: [],
    what: 'PowerShell cmdlets that report on the operational state of a VCF instance (health, alerts, configuration, versions) to the console or as HTML reports.',
    know: 'The project page does not state which VCF versions it supports. It predates VCF 9, so test it in a lab before relying on it there.',
    get: { label: 'GitHub', url: 'https://github.com/vmware/powershell-module-for-vmware-cloud-foundation-reporting' },
    checked: C,
  },

  // Automate
  {
    name: 'VCF.PowerCLI', job: 'automate', maker: 'broadcom', publisher: 'Broadcom', versions: ['9.0', '9.1'],
    what: 'PowerCLI for VCF 9, renamed from VMware.PowerCLI. One module that installs the vSphere, NSX, vSAN, SDDC Manager and VCF Operations modules and SDKs together.',
    know: 'Install from the PowerShell Gallery with `Install-Module VCF.PowerCLI`. Version numbers follow the VCF release they were built for.',
    get: { label: 'PowerShell Gallery', url: 'https://www.powershellgallery.com/packages/VCF.PowerCLI' },
    docs: [{ label: 'Introducing VCF PowerCLI 9.0', url: 'https://blogs.vmware.com/cloud-foundation/2025/06/24/introducing-vcf-powercli-9-0/' }],
    checked: C,
  },
  {
    name: 'VCF SDK for Python and Java', job: 'automate', maker: 'broadcom', publisher: 'Broadcom', versions: ['9.0', '9.1'],
    what: 'Supported client libraries for the VCF 9 APIs: vSphere (pyVmomi), vCenter, NSX, vSAN data protection, SDDC Manager, the installer, VCF Operations, Operations for networks, log management, and fleet and SDDC lifecycle. Python packages are on PyPI; Java artefacts on Maven Central.',
    know: 'Python 3.10 to 3.14. Pin the package versions to the VCF release you target.',
    get: { label: 'VCF Python SDK docs', url: 'https://developer.broadcom.com/sdks/vcf-python-sdk/latest/' },
    docs: [
      { label: 'Source and samples', url: 'https://github.com/vmware/vcf-sdk-python' },
      { label: 'Introducing the unified SDK', url: 'https://blogs.vmware.com/cloud-foundation/2025/06/24/introducing-a-unified-vcf-sdk-9-0-for-python-and-java' },
    ],
    checked: C,
  },
  {
    name: 'VCF API specifications', job: 'automate', maker: 'opensource', publisher: 'VMware (GitHub)', versions: ['9.0', '9.1'],
    what: 'Machine-readable API definitions for VCF components: OpenAPI 3 for SDDC Manager, the installer, fleet and SDDC lifecycle, VCF Operations and others; OpenAPI 2 for NSX; WSDL and OpenAPI for vSphere. Useful for generating clients in other languages and for reviewing what an API exposes.',
    get: { label: 'GitHub', url: 'https://github.com/vmware/vcf-api-specs' },
    checked: C,
  },
  {
    name: 'Terraform provider for VCF', job: 'automate', maker: 'opensource', publisher: 'VMware (GitHub, Terraform Registry)', versions: ['5.x', '9.0', '9.1'],
    what: 'Terraform resources for VCF bring-up and SDDC Manager: domains, clusters, hosts, edge clusters and related configuration.',
    know: 'Provider version matters: the README maps VCF 9.0 to provider 0.17 or later and VCF 9.1.1 to 0.19 or later, and 0.19 cannot do a 9.0 bring-up.',
    get: { label: 'Terraform Registry', url: 'https://registry.terraform.io/providers/vmware/vcf/latest/docs' },
    docs: [{ label: 'GitHub', url: 'https://github.com/vmware/terraform-provider-vcf' }],
    checked: C,
  },
  {
    name: 'Ansible collection vmware.vmware', job: 'automate', maker: 'community', publisher: 'Ansible community, Red Hat certified', versions: [],
    what: 'Ansible modules for vSphere: clusters, DRS, vCLS, appliance and guest facts, licences, and VM inventory. Certified content for Red Hat Ansible Automation Platform.',
    know: 'vSphere-level only; there are no VCF or SDDC Manager modules. The project does not state 9.x support, so test against your vCenter version first.',
    get: { label: 'GitHub', url: 'https://github.com/ansible-collections/vmware.vmware' },
    checked: C,
  },

  // Lab and learning
  {
    name: 'Holodeck', job: 'lab', maker: 'fling', publisher: 'Broadcom (VMware GitHub)', versions: ['5.2', '9.0', '9.1'],
    what: 'Deploys a complete nested VCF or VVF environment, single or dual site, on one ESX host or a vSphere cluster, for testing and training. Holodeck 9.1 can deploy VCF 5.2, 9.0 and 9.1.',
    know: 'Not a supported product; the project describes it as similar to a Fling. A single-site VCF 9.1 lab needs about 48 cores, 650 GB of memory and 2.2 TB of fast storage.',
    get: { label: 'Documentation', url: 'https://vmware.github.io/Holodeck/' },
    checked: C,
  },
  {
    name: 'Automated VCF 9.0 lab deployment', job: 'lab', maker: 'community', publisher: 'William Lam', versions: ['9.0'],
    what: 'A PowerShell script that deploys nested ESX hosts and a VCF 9.0 fleet, and optionally a workload domain, on an existing vSphere environment. Configuration is kept in a separate file.',
    get: { label: 'GitHub', url: 'https://github.com/lamw/vcf-fleet-automated-lab-deployment' },
    docs: [{ label: 'Write-up', url: 'https://williamlam.com/2025/09/automated-vmware-cloud-foundation-vcf-9-0-lab-deployment-script.html' }],
    checked: C,
  },
  {
    name: 'VCF 9 resource page (William Lam)', job: 'lab', maker: 'community', publisher: 'William Lam', versions: ['9.0', '9.1'],
    what: 'An index of articles on VCF 9 deployment, offline depots, lab builds and automation, maintained on a personal site.',
    get: { label: 'Open the page', url: 'https://williamlam.com/vmware-cloud-foundation-9-0' },
    checked: C,
  },
  {
    name: 'Flings on the Broadcom Support Portal', job: 'lab', maker: 'fling', publisher: 'Broadcom', versions: ['5.x', '9.0', '9.1'],
    what: 'Where every current Fling is downloaded, under Free Downloads. A free Broadcom account is enough. Discussion and questions are in the Flings community.',
    get: { label: 'Flings downloads', url: 'https://support.broadcom.com/group/ecx/productdownloads?subfamily=Flings&freeDownloads=true' },
    docs: [{ label: 'Flings community', url: 'https://community.broadcom.com/flings/home' }],
    checked: C,
  },
];
