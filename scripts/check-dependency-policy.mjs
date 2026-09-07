const REGISTRY_PREFIX = 'https://registry.npmjs.org/';
const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u;

const [packageJson, lockfile, policy] = await Promise.all(
  [
    'package.json',
    'package-lock.json',
    'config/dependency-license-policy.json',
  ].map(async (path) => JSON.parse(await Bun.file(path).text())),
);

const allowedLicenses = new Set(policy.allowedLicenses);
const failures = [];

for (const [name, version] of Object.entries(
  packageJson.devDependencies ?? {},
)) {
  if (!EXACT_VERSION.test(version)) {
    failures.push(`${name} must use an exact version; found ${version}.`);
  }
}

const dependencies = Object.entries(lockfile.packages ?? {}).filter(
  ([path]) => path !== '',
);
for (const [path, metadata] of dependencies) {
  const name = path.slice(path.lastIndexOf('node_modules/') + 13);
  const key = `${name}@${metadata.version}`;
  const license = policy.licenseReferences?.find(
    (reference) => reference.declared === metadata.license && reference.packages.includes(key),
  )?.license ?? metadata.license ?? policy.packageLicenses[key];

  if (!metadata.integrity?.startsWith('sha512-')) {
    failures.push(`${key} must use SHA-512 package integrity metadata.`);
  }
  if (!metadata.resolved?.startsWith(REGISTRY_PREFIX)) {
    failures.push(`${key} does not resolve from the approved registry.`);
  }
  if (!license) {
    failures.push(`${key} is missing license metadata.`);
  } else if (!allowedLicenses.has(license)) {
    failures.push(`${key} uses unapproved license ${license}.`);
  }
}

if (dependencies.length === 0) {
  failures.push('The lockfile contains no dependencies.');
}

if (failures.length > 0) {
  throw new Error(failures.sort().join('\n'));
}

process.stdout.write(
  `Verified ${dependencies.length} locked dependencies with approved integrity and licenses.\n`,
);
