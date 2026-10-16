import { Plugin } from "obsidian";

interface Pos {
	line: number;
	ch: number;
	hitSide?: boolean;
}

type FindPosV = (start: Pos, amount: number, unit: string, goalColumn?: number) => Pos;

declare global {
	interface Window {
		CodeMirrorAdapter?: { prototype: { findPosV?: FindPosV } };
	}
}

export default class GjBottomFixPlugin extends Plugin {
	onload() {
		// Vim's gj/gk ask the adapter's findPosV for the next display line. When
		// there is none (last/first line), findPosV flags `hitSide` and vim
		// re-resolves the cursor with coordsChar at the goal x. On an empty last
		// line after a list (goal x > 0, so hitSide is set), posAtCoords returns
		// null there and the adapter turns that into position 0: the cursor jumps
		// to the top of the note. Real Vim just stays put, so do that instead.
		const proto = window.CodeMirrorAdapter?.prototype;
		const orig = proto?.findPosV;
		if (!proto || !orig) return;
		proto.findPosV = function (this: unknown, start, amount, unit, goalColumn) {
			const res = orig.call(this, start, amount, unit, goalColumn);
			if (unit === "line" && res.hitSide) return { line: start.line, ch: start.ch };
			return res;
		};
		this.register(() => {
			proto.findPosV = orig;
		});
	}
}
