$(document).ready(function () {
  var table = $("#users-table").DataTable({
    lengthMenu: [
      [25, 50, 75, 100, 150, 200, -1],
      [25, 50, 75, 100, 150, 200, "All"],
    ],
    autoWidth: false,
    responsive: true,
    dom: "<'row'<'col-sm-12 text-right'i>><'row'<'col-sm-2'f><'col-sm-8 text-center'B><'col-sm-2'l>p>rt<'row'<'col-sm-2'f><'col-sm-8 text-center'B><'col-sm-2'l>p><'row'<'col-sm-12 text-right'i>>",
    initComplete: function () {
      $("div.dataTables_filter input").addClass("form-control form-control-sm"); // Adding Bootstrap classes to search input
    },
    buttons: [
      {
        extend: "copy",
        className: "btn btn-primary btn-sm", // Adding Bootstrap classes to buttons
      },
      {
        extend: "excel",
        className: "btn btn-primary btn-sm",
      },
      {
        extend: "csv",
        className: "btn btn-primary btn-sm",
      },
      {
        extend: "pdf",
        className: "btn btn-primary btn-sm",
      },
      {
        extend: "print",
        className: "btn btn-primary btn-sm",
      },
    ],
    columnDefs: [{ type: "string", targets: [2, 3] }],
  });

  yadcf.init(table, [
    { column_number: 3, filter_type: "multi_select", select_type: "select2" },
    { column_number: 4, filter_type: "multi_select", select_type: "select2" },
  ]);
});

$(".cancel-btn").click(function () {
  const userEmail = $(this).data("user-email");
  const row = $(this).closest("tr");

  $.ajax({
    url: "/admin-cancel-subscription",
    type: "POST",
    data: {
      email: userEmail,
      _csrf: $('input[name="_csrf"]').val(),
    },
    success: function (userData) {
      var table = $("#users-table").DataTable();
      var rowData = table.row(row).data();

      rowData[4] = userData.planDisplayName
        ? userData.planDisplayName
        : "Never Paid";
      rowData[5] = userData.subscription
        ? new Date(userData.subscription.current_period_end * 1000)
            .toISOString()
            .split("T")[0]
        : "";
      if (!userData.subscription) {
        rowData[7] = "";
        rowData[8] = "";
      }
      table.row(row).data(rowData).invalidate();
      alert(userData.message); // Display the message text in a popup
    },
    error: function (error) {
      alert(error.responseJSON.message); // Display the error message in a popup
    },
  });
});
$(".manage-btn").click(function () {
  const customerId = $(this).data("stripe-id");
  const url = `https://dashboard.stripe.com/customers/${customerId}`;
  window.open(url, "_blank");
});
