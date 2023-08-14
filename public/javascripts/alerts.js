document.addEventListener('DOMContentLoaded', (event) => {
    let alertMsg = document.querySelector('.alert');
    let closeButton = document.querySelector('.close-alert'); // get the close button
    if (alertMsg && closeButton) {
        setTimeout(() => {
            alertMsg.style.display = 'none';
        }, 30000); // hide after 30 seconds
        closeButton.addEventListener('click', () => { // event listener for the close button
            alertMsg.style.display = 'none';
        });
    }
});