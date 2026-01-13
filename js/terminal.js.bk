const nameText = "kraken-503";  // Replace with your name
const typedName = document.getElementById("typed-name");
let i = 0;
let deleting = false;

function typeWriter() {
  if (!typedName) return; // safety check

  if (!deleting && i < nameText.length) {
    // Typing forward
    typedName.textContent += nameText.charAt(i);
    i++;
    setTimeout(typeWriter, 120);
  } else if (deleting && i > 0) {
    // Erasing backward
    typedName.textContent = nameText.substring(0, i - 1);
    i--;
    setTimeout(typeWriter, 80);
  } else {
    // Switch modes
    if (!deleting) {
      deleting = true;
      setTimeout(typeWriter, 1000); // pause before erasing
    } else {
      deleting = false;
      setTimeout(typeWriter, 500); // pause before typing again
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  typedName.textContent = ""; // clear before typing
  typeWriter();
});

