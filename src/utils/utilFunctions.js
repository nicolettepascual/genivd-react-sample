import * as genvidMath from "../genvid-math.es5.js";
// ---------------------------------------------------------Utility methods section---------------------------------------------------------
/** Converts popularity value to popularity text */
export function popularityToText(popularity) {
    const hearts = ["💔", "♡", "♥", "💕"];
    const levels = [0.1, 1.0, 5.0];
    for (let i = 0; i < hearts.length; ++i) {
        if (popularity < levels[i]) {
            return hearts[i];
        }
    }
    return hearts[levels.length];
}
/** Changes the HTML element position to be at the center of the pos 2d sent */
export function centerAt(htmlElement, pos2d, offsetPixels) {
    // Converts from [-1, 1] range to [0, 1].
    let vh = genvidMath.vec2(0.5, 0.5);
    let pos2dN = genvidMath.mad2D(pos2d, vh, vh);

    // Converts from [0, 1] range to [0, w].
    let p = htmlElement.parentElement;
    let pSize = genvidMath.vec2(p.clientWidth, p.clientHeight);
    let posInParent = genvidMath.mul2D(pos2dN, pSize);

    // Adjusts for centering element.
    let eSize = genvidMath.vec2(
        htmlElement.clientWidth,
        htmlElement.clientHeight
    );
    let eOffset = genvidMath.muls2D(eSize, -0.5);
    let posCentered = genvidMath.add2D(posInParent, eOffset);

    // Applies user offset.
    const posFinal = genvidMath.sub2D(posCentered, offsetPixels);
    Object.assign(htmlElement.style, {
        left: posFinal.x + "px",
        bottom: posFinal.y + "px",
        position: "absolute",
        zIndex: "1100",
    });
}

/** Widens a string to at least n characters, prefixing with spaces. */
export function preN(str, n, c) {
    let s = str.length;
    if (s < n) {
        str = c.repeat(n - s) + str;
    }
    return str;
}

/** Method used to convert ms to specific duration */
export function msToDuration(duration) {
    const msInADay = 1000 * 60 * 60 * 24;
    const date = new Date(duration);
    const days = (duration - (duration % msInADay)) / msInADay;
    return `${days ? `${days}:` : ""}${date.toLocaleTimeString(undefined, {
        hour12: false,
        timeZone: "GMT",
    })}:${preN(date.getMilliseconds().toFixed(0), 3, "0")}`;
}

export function checkFullScreen() {
    return (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    );
}