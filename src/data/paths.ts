// Reading paths: short, ordered sequences of notes for one job. Each step is an article id
// (<category>/<file name>). The build fails if a step does not exist, so a renamed note cannot
// leave a path with a gap.
export type ReadingPath = { id: string; title: string; who: string; blurb: string; steps: string[] };

export const PATHS: ReadingPath[] = [
  {
    id: 'new-to-vcf-9', title: 'Coming from 5.x: the VCF 9 model', who: 'Administrators who know VCF 5.x',
    blurb: 'What the fleet is, what moved out of SDDC Manager, where the day-2 buttons went, and how identity, licensing and networking changed. Read this before planning anything.',
    steps: [
      'architecture/vcf9-mental-model', 'architecture/what-moved-from-sddc-manager', 'architecture/vcf-operations-console',
      'day-2/where-did-that-button-go', 'architecture/identity-broker', 'licensing/keys-to-license-files',
      'architecture/nsx-in-9', 'architecture/failure-impact-matrix',
    ],
  },
  {
    id: 'upgrade-52-to-9', title: 'Upgrading 5.2 to 9.x', who: 'Whoever owns the upgrade plan',
    blurb: 'From assessing the estate to the 9.1 management services, in the order the decisions have to be made: scope, order, binaries, prechecks, licensing, identity, checkpoints.',
    steps: [
      'leadership/upgrade-assessment-method', 'upgrades/planning-52-to-90', 'upgrades/upgrade-order-changed',
      'upgrades/getting-binaries', 'upgrades/prechecks-that-fail', 'licensing/licensing-through-upgrades',
      'upgrades/vidm-to-identity-broker', 'upgrades/rollback-checkpoints', 'leadership/go-no-go-and-rollback',
      'upgrades/90-to-91-management-services',
    ],
  },
  {
    id: 'on-call', title: 'On call for VCF 9', who: 'Engineers taking tickets or pages',
    blurb: 'A method first, then the logs, the locks and the five causes behind most failures, and how to hand a case to support so it is answered on the first reply.',
    steps: [
      'troubleshooting/seven-step-triage', 'troubleshooting/reading-sddc-manager-logs', 'day-2/stuck-tasks-locks',
      'day-2/dns-ntp-proxy', 'troubleshooting/certificate-failures', 'troubleshooting/password-and-account-failures',
      'troubleshooting/services-runtime-kubectl', 'leadership/escalating-well',
    ],
  },
  {
    id: 'licensing-9', title: 'Licensing in 9.x', who: 'Administrators and the people who buy the licences',
    blurb: 'The licence file model, the two activation codes, reporting modes, assignment, the 180-day cycle, the 9.1 License Server, and what to do when it has already gone wrong.',
    steps: [
      'licensing/keys-to-license-files', 'licensing/two-activation-codes', 'licensing/connected-vs-disconnected',
      'licensing/assigning-licenses', 'licensing/180-day-cycle', 'licensing/license-server',
      'licensing/licensing-errors-decoded', 'licensing/expired-estate-recovery',
    ],
  },
  {
    id: 'lab', title: 'Building a VCF 9 lab', who: 'Anyone who needs a lab to learn or test in',
    blurb: 'Choose an approach, size it, get it running on lab hardware and an offline depot, then use it: break things on purpose and automate the checks.',
    steps: [
      'labs/choosing-a-lab-approach', 'labs/sizing-a-vcf-9-lab', 'labs/esx-settings-for-labs',
      'labs/offline-depot-in-a-lab', 'labs/nested-lab-automation', 'labs/break-fix-exercises', 'labs/scripted-health-checks',
    ],
  },
];
