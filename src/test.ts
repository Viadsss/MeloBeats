import sanitize from "sanitize-filename";

const text = "Valley - Oh shit…are we in ?love";
const sanitized = sanitize(text, { replacement: "_" });
console.log(sanitized);
