var changeSubscriptionForm = document.getElementById('change-subscription-form');

if (changeSubscriptionForm) {
    changeSubscriptionForm.addEventListener('submit', function() {
        var currentPlanIdElement = document.getElementById('currentPlanId');
        var memberIdElement = document.getElementById('memberId');
        var alumniIdElement = document.getElementById('alumniId');

        if (currentPlanIdElement && memberIdElement && alumniIdElement) {
            var currentPlanId = currentPlanIdElement.value;
            var memberId = memberIdElement.value;
            var alumniId = alumniIdElement.value;
            var newPlanId;

            if (currentPlanId == memberId) {
                newPlanId = alumniId;
            } else {
                newPlanId = memberId;
            }
            document.getElementById('newPlanId').value = newPlanId;
        }
    });
}
