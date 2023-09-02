document.addEventListener("DOMContentLoaded", (event) => {
  let alertMsg = document.querySelector(".alert");
  if (alertMsg) {
    setTimeout(() => {
      alertMsg.style.display = "none";
    }, 30000); // hide after 30 seconds
  }
});
