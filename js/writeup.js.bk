// Typing animation for the terminal card
const nameText = "YourNameHere";  // <-- Replace with your name
const typedName = document.getElementById("typed-name");
let i = 0;

function typeWriter() {
  if (i < nameText.length) {
    typedName.textContent += nameText.charAt(i);
    i++;
    setTimeout(typeWriter, 120);
  }
}
document.addEventListener("DOMContentLoaded", typeWriter);

// ----------------------
// Writeups functionality
// ----------------------
const writeups = [
  {
    title: "CTF Challenge: SQL Injection",
    date: "Jan 2026",
    link: "writeups/sql-injection.html" // <-- link to full writeup page
  },
  {
    title: "Exploring Linux Privilege Escalation",
    date: "Dec 2025",
    link: "writeups/linux-priv-esc.html"
  }
];

function loadWriteups() {
  const container = document.getElementById("writeups-container");
  writeups.forEach(w => {
    const heading = document.createElement("a");
    heading.className = "writeup-heading";
    heading.href = w.link;
    heading.innerHTML = `<h3>$ cat ${w.title.replace(/\s+/g, "_")}.txt</h3><small>${w.date}</small>`;
    container.appendChild(heading);
  });
}

document.addEventListener("DOMContentLoaded", loadWriteups);

