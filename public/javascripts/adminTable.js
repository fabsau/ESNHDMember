$(document).ready(function() {
    var table = $('#users-table').DataTable({
        "lengthMenu": [[25, 50, 75, 100, 150, 200, -1], [25, 50, 75, 100, 150, 200, "All"]],
        "autoWidth": false,
        "responsive": true,
        "dom": 'Blftrip',
        "buttons": [ 'copy', 'excel', 'pdf', 'print' ],
        "columnDefs": [
            { type: "string", targets: [2, 3] }
        ]
    });

    yadcf.init(table, [
        { column_number: 2, filter_type: "multi_select", select_type: 'select2' },
        { column_number: 3, filter_type: "multi_select", select_type: 'select2' }
    ]);
});

$('.cancel-btn').click(function() {
    const userEmail = $(this).data('user-email');
    const row = $(this).closest('tr');

    $.ajax({
        url: '/admin-cancel-subscription',
        type: 'POST',
        data: {
            email: userEmail,
            _csrf: $('input[name="_csrf"]').val()
        },
        success: function(userData) {
            var table = $('#users-table').DataTable();
            var rowData = table.row(row).data();

            rowData[3] = userData.planDisplayName ? userData.planDisplayName : 'Never Paid';
            rowData[4] = userData.subscription ? new Date(userData.subscription.current_period_end * 1000).toISOString().split("T")[0] : '';
            if (!userData.subscription) {
                rowData[6] = '';
                rowData[7] = '';
            }
            table.row(row).data(rowData).invalidate();
            alert(userData.message);  // Display the message text in a popup
        },
        error: function(error) {
            alert(error.responseJSON.message);  // Display the error message in a popup
        }
    });
});
$('.manage-btn').click(function() {
    const customerId = $(this).data('stripe-id');
    const url = `https://dashboard.stripe.com/customers/${customerId}`;
    window.open(url, '_blank');
});

