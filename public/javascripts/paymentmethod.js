window.onload = function () {
  selectPaymentMethod("sepa");
};

var sepaButtons = document.querySelectorAll(".sepa");
var visaButtons = document.querySelectorAll(".visa");

sepaButtons.forEach(function (sepaButton) {
  sepaButton.addEventListener("click", function () {
    selectPaymentMethod("sepa");
  });
});

visaButtons.forEach(function (visaButton) {
  visaButton.addEventListener("click", function () {
    selectPaymentMethod("visa");
  });
});

function selectPaymentMethod(method) {
  sepaButtons.forEach(function (sepaButton) {
    sepaButton.classList.remove("active");
  });
  visaButtons.forEach(function (visaButton) {
    visaButton.classList.remove("active");
  });
  var selectedButtons = document.querySelectorAll(`.${method}`);
  selectedButtons.forEach(function (selectedButton) {
    selectedButton.classList.add("active");
    // Update the paymentMethod input for both purchase forms
    document
      .querySelectorAll('input[name="paymentMethod"]')
      .forEach(function (input) {
        input.value = method;
      });
  });
}
