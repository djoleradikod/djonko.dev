// Catalogue of publicly available tools for VCF 9.x, shown at /vcf/tools/.
//
// Rules for entries:
// - Link to the publisher's own page. Nothing is rehosted or mirrored here.
// - Publicly available only. Tools and repositories that are not public are never listed, even when a
//   public page mentions them.
// - Describe in our own words what the tool does and what to know before using it.
// - `checked` is the date the links and facts were last confirmed against the source.
//   scripts/check-external.mjs re-checks every link (`npm run gate -- --external`).

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
  community: { label: 'Community', note: 'Written by an individual or a community project, outside Broadcom products and support. Check the result against official documentation.' },
  commercial: { label: 'Commercial', note: 'Third-party product with a paid licence. Listed for completeness, not endorsed.' },
};

const C = '2026-11-02';
/** Entries re-read against the publisher's own page on this date. */
const V = '2026-11-07';

export const TOOLS: Tool[] = [
  // Plan and size
  {
    name: 'VCF 9.1 Upgrade Planning Tool', job: 'plan', maker: 'broadcom', publisher: 'Broadcom (VMware GitHub Pages)', versions: ['5.x', '9.0', '9.1'],
    what: 'A browser-based planner. You describe the current estate (version, topology, add-ons) and it produces an ordered upgrade path to 9.1, with the prerequisites for each step. It exports the plan to PDF. Later releases added 9.1.1 and express-patch paths, a separate planner for vCenter, Supervisor and VKS, and export and import of a session.',
    know: 'Runs in the browser and needs no access to the environment. Treat the output as a draft runbook: confirm each step against the release notes and the interoperability matrix.',
    get: { label: 'Open the planner', url: 'https://vmware.github.io/vcf-upgrade-planner/' },
    docs: [
      { label: 'Announcement', url: 'https://blogs.vmware.com/cloud-foundation/2026/05/28/announcing-the-vmware-cloud-foundation-9-1-upgrade-planning-tool/' },
      { label: 'Issues and feedback', url: 'https://github.com/vmware/vcf-upgrade-planner' },
    ],
    checked: V,
  },
  {
    name: 'Broadcom Interoperability Matrix', job: 'plan', maker: 'broadcom', publisher: 'Broadcom', versions: ['5.x', '9.0', '9.1'],
    what: 'Which versions of VCF components, and of other Broadcom products, are supported together, and which upgrade paths between versions are supported.',
    know: 'Check it for every component that integrates with VCF, not only the core stack: backup, monitoring and any product that talks to vCenter or NSX.',
    get: { label: 'Open the matrix', url: 'https://interopmatrix.broadcom.com/Interoperability' },
    checked: V,
  },
  {
    name: 'Broadcom Compatibility Guide', job: 'plan', maker: 'broadcom', publisher: 'Broadcom', versions: ['5.x', '9.0', '9.1'],
    what: 'Certified hardware for ESX and vSAN: servers, I/O controllers, NICs, drives and vSAN ReadyNodes. The successor to the VMware Compatibility Guide.',
    know: 'VCF deployment validation can fail when vSAN hardware is not certified for the target release (KB 427591). It can also report a false failure when the installer has stale compatibility data (KB 442952, 9.0.x). Look up drivers and firmware for the target ESX release before the window, not during it.',
    get: { label: 'Open the guide', url: 'https://compatibilityguide.broadcom.com/' },
    docs: [
      { label: 'vSAN ESA ReadyNode hardware guidance', url: 'https://compatibilityguide.broadcom.com/pages/vsan-esa-readynode-hardware-guidance' },
      { label: 'Verifying compatibility for VCF on vSAN', url: 'https://blogs.vmware.com/cloud-foundation/2024/11/20/verifying-compatibility-for-vmware-cloud-foundation-environments-powered-by-vsan/' },
    ],
    kbs: [326717, 427591, 442952],
    checked: V,
  },
  {
    name: 'vSAN ReadyNode Sizer', job: 'plan', maker: 'broadcom', publisher: 'Broadcom', versions: ['5.x', '9.0', '9.1'],
    what: 'Sizes vSAN clusters from workload profiles: host count, capacity after protection overhead, and ReadyNode configurations that fit.',
    know: 'Its old address now redirects here, and the page asks for a Broadcom sign-in. Behind that sign-in, this description could not be rechecked on 7 Nov 2026.',
    get: { label: 'Open the sizer', url: 'https://vcf.broadcom.com/tools/vsansizer/home' },
    checked: C,
  },
  {
    name: 'VCF Operations sizing', job: 'plan', maker: 'broadcom', publisher: 'Broadcom', versions: ['9.0', '9.1'],
    what: 'Two estimators and a sizing KB. The Operations estimator asks for a version (9.1, 9.0 or 8.18) and covers VCF Operations and Log Management. The separate logs estimator sizes a VCF Operations for Logs cluster from average log size, infrastructure size or events per second, and the retention and archival periods.',
    know: 'KB 397782 and its spreadsheet cover 9.0 only, including continuous-availability clusters and cloud proxies. For 9.1.x, the Broadcom sizing index (KB 324340) points to VMware Configuration Maximums.',
    get: { label: 'Operations estimator', url: 'https://vropssizer.broadcom.com/' },
    docs: [{ label: 'Logs estimator', url: 'https://vrlisizer.broadcom.com/' }],
    kbs: [397782, 324340],
    checked: V,
  },
  {
    name: 'VCF Upgrade Path Planner (vmtechie)', job: 'plan', maker: 'community', publisher: 'vmtechie.blog', versions: ['4.x', '5.x', '9.0'],
    what: 'A community web planner for major upgrades from vSphere 7 and 8, or VCF 4.x and 5.x, to VCF 9.0. It produces a roadmap with prerequisites, KB references and time estimates.',
    know: 'Targets 9.0, not 9.1. For 9.1 use the Broadcom planner above. The page states it is independent of Broadcom.',
    get: { label: 'Open the planner', url: 'https://avnish80.github.io/vcf-upgrade-planner' },
    checked: V,
  },
  {
    name: 'RVTools', job: 'plan', maker: 'vendor', publisher: 'Dell Technologies', versions: [],
    what: 'A Windows application that reports a vCenter inventory (VMs, hosts, clusters, datastores, snapshots, tools versions), with export options.',
    know: 'Check the release notes for the vCenter versions supported before running it against a 9.x vCenter. Dell runs a voluntary Product Improvement Program; you can change your participation under Edit, Preferences.',
    get: { label: 'Download from Dell', url: 'https://www.dell.com/en-us/shop/vmware/sl/rvtools' },
    checked: V,
  },
  {
    name: 'VCF Designer', job: 'plan', maker: 'commercial', publisher: 'VCF Designer (third party)', versions: ['9.0', '9.1'],
    what: 'A browser-based design tool for VCF 9.x. It imports planning workbooks and RVTools exports, validates a design against VCF 9.0 and 9.1 rules, sizes domains, and exports design documents and diagrams.',
    know: 'Paid subscription with a 14-day free trial. Its page does not state any link to Broadcom.',
    get: { label: 'Product page', url: 'https://vcfdesigner-landing.pages.dev/' },
    checked: V,
  },

  // Deploy and get binaries
  {
    name: 'VCF Installer', job: 'deploy', maker: 'broadcom', publisher: 'Broadcom', versions: ['9.0', '9.1'],
    what: 'The appliance that deploys a new VCF or VVF fleet in 9.x, replacing Cloud Builder. It also converges an existing vSphere environment into VCF. It can run its validations on its own, against an existing environment, without deploying anything.',
    know: 'Running the prechecks alone needs only the appliance and a connected online or offline depot; checks that depend on binaries fail until they are downloaded. On 9.1, KB 443647 says download tokens are no longer used for depot authentication. The May cheat sheet from William Lam says tokens still work, except for ESX updates and patches through the Download Tool, which need a code.',
    get: { label: 'Deployment troubleshooting (9.1 docs)', url: 'https://techdocs.broadcom.com/us/en/vmware-cis/vcf/vcf-9-0-and-later/9-1/deployment/deploying-a-new-vmware-cloud-foundation-or-vmware-vsphere-foundation-private-cloud-/troubleshooting-vmware-cloud-foundation-or-vmware-vsphere-foundation-deployments.html' },
    docs: [
      { label: 'Converge vSphere to VCF 9.0', url: 'https://blogs.vmware.com/cloud-foundation/2026/02/05/how-to-converge-a-vmware-vsphere-environment-to-vmware-cloud-foundation-9-0/' },
      { label: 'Lam: VCF Download Tool cheat sheet', url: 'https://williamlam.com/2026/05/vcf-9-1-vcf-download-tool-vcfdt-cheatsheet.html' },
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
    what: 'A standalone diagnostic tool for VCF 9.1 and the management services. It runs pre-upgrade readiness checks, follows a running deployment or upgrade on a live timeline, and reports day-2 service health. Builds for macOS, Windows and Linux.',
    know: 'Needs network access on ports 22, 443, 5480 and 6443, and either the vmware-system-user account or SDDC Manager administrator credentials. The announcement sends feedback and bug reports to the Flings community channels.',
    get: { label: 'Download (Broadcom Support Portal, free)', url: 'https://support.broadcom.com/group/ecx/productfiles?subFamily=Flings&displayGroup=VCF%20Inspector&release=1.400&os=&servicePk=&language=EN&freeDownloads=true' },
    docs: [{ label: 'Announcement', url: 'https://blogs.vmware.com/cloud-foundation/2026/07/28/vcf-inspector-fling/' }],
    checked: V,
  },
  {
    name: 'SoS utility', job: 'upgrade', maker: 'broadcom', publisher: 'Broadcom (built into SDDC Manager)', versions: ['5.x', '9.0', '9.1'],
    what: 'The supportability tool on SDDC Manager. `sos --health-check` checks the components SDDC Manager manages, and on 5.x and 9.0.x it fails on active locks. On 9.1 it leaves out VCF management services, VCF Automation and VCF Operations, and `--domain-name` defaults to MANAGEMENT for SoS operations and takes ALL. Other options collect log bundles for support. The 9.1 upgrade-readiness KB pairs it with VDT on each vCenter.',
    know: 'Run as root on SDDC Manager from /opt/vmware/sddc-support/sos. Health checks are read-only; log collection writes bundles to disk, so check free space first.',
    get: { label: 'Health checks for 9.1 upgrade readiness', url: 'https://knowledge.broadcom.com/external/article/454898' },
    docs: [{ label: 'What the 9.1 health check covers', url: 'https://techdocs.broadcom.com/us/en/vmware-cis/vcf/vcf-9-0-and-later/9-1/deployment/deploying-a-new-vmware-cloud-foundation-or-vmware-vsphere-foundation-private-cloud-/troubleshooting-vmware-cloud-foundation-or-vmware-vsphere-foundation-deployments.html' }],
    kbs: [454898, 439473, 385749],
    checked: C,
  },
  {
    name: 'Bundle Cleanup Utility', job: 'upgrade', maker: 'broadcom', publisher: 'Broadcom (built into SDDC Manager)', versions: ['5.x', '9.0', '9.1'],
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
    checked: V,
  },

  // Diagnose and repair
  {
    name: 'VCF Diagnostic Tool for vSphere (VDT)', job: 'diagnose', maker: 'broadcom', publisher: 'Broadcom (KB attachment)', versions: ['5.x', '9.0', '9.1'],
    what: 'Python scripts that run on the vCenter appliance and report PASS, WARN and FAIL for known configuration problems: SSO and lookup service, certificates, VMdir, DNS, NTP, disk, database size, services and identity sources.',
    know: 'Read-only, and it records no passwords. Use a release without the _beta suffix if a beta build misbehaves. Check the KB for the current version; the same package also has modes for SDDC Manager and VKS.',
    get: { label: 'Download from the KB', url: 'https://knowledge.broadcom.com/external/article/344917' },
    kbs: [344917],
    checked: V,
  },
  {
    name: 'VDT for SDDC Manager', job: 'diagnose', maker: 'broadcom', publisher: 'Broadcom (KB attachment)', versions: ['5.x', '9.0', '9.1'],
    what: 'The VDT checks for SDDC Manager: its certificates and those of vCenter and NSX, inventory state, disk, NFS permissions, failed password tasks, manifest and depot, and locks.',
    know: 'Read-only. Marked beta. Prompts for the SSO administrator password; without it only the unauthenticated checks run.',
    get: { label: 'How to run it', url: 'https://knowledge.broadcom.com/external/article/314610/using-the-vcf-diagnostic-tool-for-sddc-m.html' },
    kbs: [314610],
    checked: V,
  },
  {
    name: 'VDT for VKS', job: 'diagnose', maker: 'broadcom', publisher: 'Broadcom (KB attachment)', versions: ['5.x', '9.0', '9.1'],
    what: 'The VDT checks for vSphere Kubernetes Service. It runs on the vCenter appliance and connects to the Supervisor nodes over SSH.',
    know: 'Read-only. Marked beta. Run with `python vdt.py -p vks`; set SUPERVISOR_NAME when there is more than one Supervisor.',
    get: { label: 'How to run it', url: 'https://knowledge.broadcom.com/external/article/402184/using-the-vcf-diagnostic-tool-for-vspher.html' },
    kbs: [402184],
    checked: V,
  },
  {
    name: 'vCert', job: 'diagnose', maker: 'broadcom', publisher: 'Broadcom (KB attachment)', versions: ['5.x', '9.0', '9.1'],
    what: 'A menu-driven script for vCenter certificates: health checks, replacement of Machine SSL, solution user, STS signing and VMCA certificates, clean-up of trusted roots, and ESX host certificates.',
    know: 'Changes the system. Intended for use with Broadcom Support. Take offline snapshots or file-based backups of every vCenter in the SSO domain first. Replacing the STS signing certificate invalidates scheduled tasks.',
    get: { label: 'Download from the KB', url: 'https://knowledge.broadcom.com/external/article/385107' },
    kbs: [385107],
    checked: V,
  },
  {
    name: 'VCF certificate tool (vcf-cert-tool)', job: 'diagnose', maker: 'broadcom', publisher: 'Broadcom (Support Portal download)', versions: ['5.2', '9.0', '9.1'],
    what: 'One menu-driven tool for expired or broken internal certificates across vCenter, ESX, NSX, the Supervisor, VCF Operations and the cloud proxy. It brings together workflows that used to need vCert, CARR and certmgr separately.',
    know: 'Changes the system. Use only under the direction of Broadcom Support, after backups. Replacing a certificate does not update the trust that other components hold; those may need a separate refresh. Download from the VCF 9 Drivers & Tools tab.',
    get: { label: 'KB with download steps', url: 'https://knowledge.broadcom.com/external/article/445742' },
    kbs: [445742],
    checked: V,
  },

  // Operate and monitor
  {
    name: 'Management Pack Builder', job: 'operate', maker: 'broadcom', publisher: 'Broadcom (built into VCF Operations)', versions: ['9.0', '9.1'],
    what: 'Builds VCF Operations management packs without code: point it at a REST API, map the responses to objects, metrics and properties, and install the result as an adapter. In 9.x it is under Build, Developer Center.',
    know: 'After upgrading VCF Operations to 9.1.1, packs built with an earlier MP Builder stop collecting until each design is reopened and reinstalled from the updated builder.',
    get: { label: 'Overview', url: 'https://blogs.vmware.com/cloud-foundation/2026/02/04/extending-visibility-with-vmware-cloud-foundations-management-pack-builder/' },
    kbs: [454434],
    checked: V,
  },
  {
    name: 'VMware.CloudFoundation.Reporting', job: 'operate', maker: 'opensource', publisher: 'VMware (GitHub)', versions: ['5.x'],
    what: 'PowerShell cmdlets that report on the operational state of a VCF instance (health, alerts, configuration, versions) to the console or as HTML reports.',
    know: 'Its last release, v2.7.0 of 22 May 2025, sustains it for supported 5.x versions and gives no support or enhancements to future major releases. The notice does not name 9.x, so plan its replacement into the upgrade.',
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
    checked: V,
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
    checked: V,
  },
  {
    name: 'VCF API specifications', job: 'automate', maker: 'opensource', publisher: 'VMware (GitHub)', versions: ['9.0', '9.1'],
    what: 'Machine-readable API definitions for VCF components: OpenAPI 3 for SDDC Manager, the installer, fleet and SDDC lifecycle, VCF Operations and others; OpenAPI 2 for NSX; WSDL and OpenAPI for vSphere. Useful for generating clients in other languages and for reviewing what an API exposes.',
    get: { label: 'GitHub', url: 'https://github.com/vmware/vcf-api-specs' },
    checked: V,
  },
  {
    name: 'Terraform provider for VCF', job: 'automate', maker: 'opensource', publisher: 'VMware (GitHub, Terraform Registry)', versions: ['5.x', '9.0', '9.1'],
    what: 'Terraform resources for VCF bring-up and SDDC Manager: domains, clusters, hosts, edge clusters and related configuration.',
    know: 'Provider version matters: the provider docs map VCF 9.0 to provider 0.17 or later and VCF 9.1.1 to 0.19 or later. PR 445 says `vcf_instance` in v0.19.0 cannot do bring-up for VCF 9.0.0 and earlier.',
    get: { label: 'Terraform Registry', url: 'https://registry.terraform.io/providers/vmware/vcf/latest/docs' },
    docs: [{ label: 'GitHub', url: 'https://github.com/vmware/terraform-provider-vcf' }, { label: 'PR 445', url: 'https://github.com/vmware/terraform-provider-vcf/pull/445' }],
    checked: C,
  },
  {
    name: 'Ansible collection vmware.vmware', job: 'automate', maker: 'community', publisher: 'Ansible community, Red Hat certified', versions: [],
    what: 'Ansible modules for vSphere: clusters (DRS, HA, vCLS), ESX hosts, VMs and snapshots, content libraries, tags, key providers, appliance settings and backup schedules, and licence facts, plus inventory plugins for hosts and VMs. Certified content for Red Hat Ansible Automation Platform.',
    know: 'vSphere-level only; there are no VCF or SDDC Manager modules. The project does not state 9.x support, so test against your vCenter version first.',
    get: { label: 'GitHub', url: 'https://github.com/ansible-collections/vmware.vmware' },
    checked: V,
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
    name: 'Automated VCF 9.x lab deployment', job: 'lab', maker: 'community', publisher: 'William Lam', versions: ['9.0', '9.1'],
    what: 'PowerShell scripts that deploy nested ESX hosts and a VCF or VVF fleet, and optionally a workload domain, on an existing vSphere environment. Configuration is kept in a separate file. The main scripts have 9.1 samples, and the 9.0 fleet script and samples are in a 9.0 folder.',
    get: { label: 'GitHub', url: 'https://github.com/lamw/vcf-fleet-automated-lab-deployment' },
    docs: [{ label: 'Write-up (9.0)', url: 'https://williamlam.com/2025/09/automated-vmware-cloud-foundation-vcf-9-0-lab-deployment-script.html' }],
    checked: C,
  },
  {
    name: 'VCF 9 resource pages (William Lam)', job: 'lab', maker: 'community', publisher: 'William Lam', versions: ['9.0', '9.1'],
    what: 'Indexes of articles on VCF 9.1 and 9.0: deployment, offline depots, lab builds and automation, maintained on a personal site.',
    get: { label: 'Open the 9.1 page', url: 'https://williamlam.com/vmware-cloud-foundation-9' },
    docs: [{ label: 'The 9.0 page', url: 'https://williamlam.com/vmware-cloud-foundation-9-0' }],
    checked: V,
  },
  {
    name: 'Flings on the Broadcom Support Portal', job: 'lab', maker: 'fling', publisher: 'Broadcom', versions: ['5.x', '9.0', '9.1'],
    what: 'Broadcom lists Flings on its Support Portal under Free Downloads. Feedback and questions go to the Flings community, which may ask you to sign in.',
    get: { label: 'Flings downloads', url: 'https://support.broadcom.com/group/ecx/productdownloads?subfamily=Flings&freeDownloads=true' },
    docs: [{ label: 'Flings community', url: 'https://community.broadcom.com/flings/home' }],
    checked: C,
  },
];
