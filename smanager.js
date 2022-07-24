/** @param {NS} ns */
export async function main(ns) {
	ns.tail();
	ns.disableLog("ALL");

	let maxservers = ns.args[0] || 10;
	let startram = Math.pow(2, 4); // 16
	let maxram = Math.pow(2, 15); // 32,768
	let endless = false;
	
	let money = () => ns.getPlayer().money;
	let scost = (r) => ns.getPurchasedServerCost(r);
	let servers = () => ns.getPurchasedServers();
	let count = () => servers().length;

	let weakest = () => servers().sort((a, b) => sram(a) - sram(b))[0];
	let largest = () => servers().sort((a, b) => sram(b) - sram(a))[0];
	let sram = (s) => ns.getServerMaxRam(s);

	function remove() {
		let w = weakest();
		let r = sram(w);
		ns.killall(w);
		ns.deleteServer(w);
		ns.print(`INFO ${w} ${r} deleted`);
	}

	async function purchase(r) {
		let name = ns.purchaseServer(`home`, r);
		ns.print(`INFO ${name} ${r} purchased for ${scost(r).toLocaleString()}`);
	}

	while (true) {
		if (!endless && count() >= maxservers)
			break;

		if (count() >= maxservers && sram(weakest()) >= maxram)
			break;

		let ram = count() ? sram(largest()) * 2 : startram;

		if (count() >= maxservers && money() > scost(ram))
			remove();

		if (count() < maxservers && money() > scost(ram))
			await purchase(Math.min(ram, maxram));

		await ns.sleep(10000);
	}
}