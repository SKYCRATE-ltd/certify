import {
	exists,
	exec,
	copy,
	mkdir,
	is_sudo,
	is_installed
} from "computer";
import {
	dirname
} from "path";
import Program from "termite";

const PLATFORM = (process => {
	let platform = process.platform;
	let architecture = process.arch;

	if (platform === "win32")
		platform = "windows", architecture += '.exe';

	if (['x32', 'x64'].includes(architecture))
		architecture = architecture.replace('x', 'amd');
	
	return `${platform}-${architecture}`;
})(process);

const MKCERT = `${dirname}/bin/${PLATFORM}`;

function setup(local = exec(`${MKCERT} -CAROOT`)) {
	if (!exists(`${local}/rootCA.pem`)) {
		mkdir(local); // ensure it exists...
		copy(`${dirname}/etc/rootCA.pem`, `${local}`);
		copy(`${dirname}/etc/rootCA-key.pem`, `${local}`);
	}
	exec(`${MKCERT} -install`);
}

export default Program({
	["@init"](cmd) {
		if (cmd !== "install")
			setup();
	},
	create(...domains) {
		return exec(`cd etc/ && ${MKCERT} ${domains.join(' ')}`);
	},
	install() {
		if (is_sudo())
			return this.error('Must be sudo, baby.');

		const libnss = [
			['port', 'install nss'],
			['apt', 'install -y libnss3-tools'],
			['yum', 'install nss-tools'],
			['pacman', '-S nss'],
			['zypper', 'install mozilla-nss-tools'],
			['brew', 'install nss'],
		];

		for (let [pkgr, script] in libnss) {
			if (is_installed(pkgr)) {
				exec(`${pkgr} ${script}`);
				break;
			}
		}

		setup();
	}
});