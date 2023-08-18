window.onload = function() {
    document.getElementById('annually').click();
    // Select SEPA by default
    selectPaymentMethod('sepa');
}

var sepaButtons = document.querySelectorAll('.sepa');
var visaButtons = document.querySelectorAll('.visa');

sepaButtons.forEach(function(sepaButton) {
    sepaButton.addEventListener('click', function() {
        selectPaymentMethod('sepa');
    });
});

visaButtons.forEach(function(visaButton) {
    visaButton.addEventListener('click', function() {
        selectPaymentMethod('visa');
    });
});

document.getElementById('monthly').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('annually').classList.remove('active');
    updatePriceAndPeriod('member', '5€', '/6-Months');
    updatePriceAndPeriod('alumni', '10€', '/6-Months');
    // Update the priceId for the Buy Now and Switch Plan buttons
    updatePlanIds('member', process.env.SUBSCRIPTION_PRICE_ID_MEMBER_6MONTHS);
    updatePlanIds('alumni', process.env.SUBSCRIPTION_PRICE_ID_ALUMNI_6MONTHS);
});

document.getElementById('annually').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('monthly').classList.remove('active');
    updatePriceAndPeriod('member', '10€', '/yearly');
    updatePriceAndPeriod('alumni', '20€', '/yearly');
    // Update the priceId for the Buy Now and Switch Plan buttons
    updatePlanIds('member', process.env.SUBSCRIPTION_PRICE_ID_MEMBER_ANNUALLY);
    updatePlanIds('alumni', process.env.SUBSCRIPTION_PRICE_ID_ALUMNI_ANNUALLY);
});

function updatePlanIds(plan, priceId) {
    document.getElementById(`${plan}-priceId`).value = priceId;
    document.getElementById(`${plan}-newPlanId`).value = priceId;
}

function updatePriceAndPeriod(plan, price, period) {
    document.getElementById(`${plan}-price`).innerText = price;
    document.getElementById(`${plan}-period`).innerText = period;
}

function selectPaymentMethod(method) {
    sepaButtons.forEach(function(sepaButton) {
        sepaButton.classList.remove('active');
    });
    visaButtons.forEach(function(visaButton) {
        visaButton.classList.remove('active');
    });
    var selectedButtons = document.querySelectorAll(`.${method}`);
    selectedButtons.forEach(function(selectedButton) {
        selectedButton.classList.add('active');
        document.getElementById('paymentMethod').value = method;
    });
}