document.addEventListener('DOMContentLoaded', (event) => {
    function checkTitle() {
        if(window.innerWidth <= 576) {
            document.title = "ESN Member Portal";
            document.querySelector(".navbar-brand span:nth-child(2)").textContent = " ESN Member Portal";
        } else {
            document.title = "ESN Heidelberg Member Portal";
            document.querySelector(".navbar-brand span:nth-child(2)").textContent = " ESN Heidelberg Member Portal";
        }
    }
    checkTitle();
    window.onresize = checkTitle;
});