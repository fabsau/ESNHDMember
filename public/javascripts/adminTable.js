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
$('.manage-btn').click(function() {
    const customerId = $(this).data('stripe-id');
    const url = `https://dashboard.stripe.com/customers/${customerId}`;
    window.open(url, '_blank');
});