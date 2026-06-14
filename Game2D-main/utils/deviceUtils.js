/** True when playing on a phone / narrow touch viewport. */
export function isPhonePlay() {
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const narrow = window.innerWidth <= 900;
    return touch && narrow;
}
