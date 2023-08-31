var changeSubscriptionForm = document.getElementById('change-subscription-form');

if (changeSubscriptionForm) {
    changeSubscriptionForm.addEventListener('submit', function() {
        var currentPlanId = '#{currentPlan}';
        var newPlanId;
        if (currentPlanId == process.env.SUBSCRIPTION_PRICE_ID_MEMBER_6MONTHS) {
            newPlanId = process.env.SUBSCRIPTION_PRICE_ID_ALUMNI_6MONTHS;
        } else {
            newPlanId = process.env.SUBSCRIPTION_PRICE_ID_MEMBER_6MONTHS;
        }
        document.getElementById('newPlanId').value = newPlanId;
    });
}