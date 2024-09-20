$(document).ready(function () {
    const apiUrl = "http://ajax1.lmsoft.cz/procedure.php";
    const username = "coffe";
    const password = "kafe";

    function sendRequest(endpoint, data, method = 'GET', callback) {
        $.ajax({
            url: `${apiUrl}?cmd=${endpoint}&${data}`,
            type: method,
            dataType: 'json',
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            headers: {
                "Authorization": "Basic " + btoa(username + ":" + password)
            },
            success: function (response) {
                console.log("API Response:", response);
                callback(response);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error("API Error:", textStatus, errorThrown);
                displayFeedback('Došlo k chybě.');
            }
        });
    }

    function displayFeedback(message) {
        $('#feedback').text(message).show().delay(3000).fadeOut();
    }

    function populateMonthOptions() {
        let options = '';
        for (let i = 1; i <= 12; i++) {
            options += `<option value="${i}">${i}</option>`;
        }
        $('#startMonth').html(options);
        $('#endMonth').html(options);
    }

    function updateTable(data) {
        let rows = '';
        if (data && data.length > 0) {
            $.each(data, function (index, entry) {
                rows += `<tr>
                            <td>${entry[0]}</td>
                            <td>${entry[1]}</td>
                        </tr>`;
            });
        } else {
            rows = '<tr><td colspan="2">Žádná data k dispozici</td></tr>';
        }
        $('#dataTable tbody').html(rows);
    }

    function mergeData(allData) {
        const result = {};
        
        $.each(allData, function (index, data) {
            if (Array.isArray(data)) {
                $.each(data, function (index, entry) {
                    if (Array.isArray(entry) && entry.length >= 2) {
                        const drink = entry[0];
                        const count = parseInt(entry[1], 10);
                        if (!result[drink]) {
                            result[drink] = 0;
                        }
                        result[drink] += count;
                    }
                });
            }
        });
    
        return Object.keys(result).map(drink => [drink, result[drink]]);
    }
    

    function loadTableData(startMonth, endMonth) {
        $('#dataTable').hide();
        const requests = [];
    
        if (startMonth === endMonth) {
            requests.push(
                $.ajax({
                    url: `${apiUrl}?cmd=getSummaryOfDrinks&month=${startMonth}`,
                    type: 'GET',
                    dataType: 'json',
                    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
                    headers: {
                        "Authorization": "Basic " + btoa(username + ":" + password)
                    }
                })
            );
        } else {
            for (let month = parseInt(startMonth, 10); month <= parseInt(endMonth, 10); month++) {
                requests.push(
                    $.ajax({
                        url: `${apiUrl}?cmd=getSummaryOfDrinks&month=${month}`,
                        type: 'GET',
                        dataType: 'json',
                        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
                        headers: {
                            "Authorization": "Basic " + btoa(username + ":" + password)
                        }
                    })
                );
            }
        }
    
        $.when.apply($, requests).done(function () {
            console.log("Requests Done:", arguments)
    
            const allData = Array.prototype.slice.call(arguments).map(arg => {
                console.log("API Argument:", arg);
                return arg[0]; 
            });
            
            const mergedData = mergeData(allData);
            updateTable(mergedData);
            $('#dataTable').show();
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.error("Requests Fail:", textStatus, errorThrown);
            displayFeedback('Došlo k chybě při načítání dat.');
        });
    }
    

    $('#filterForm').on('submit', function (e) {
        e.preventDefault();
        const startMonth = $('#startMonth').val();
        const endMonth = $('#endMonth').val();

        if (startMonth > endMonth) {
            displayFeedback('Začátek měsíce nemůže být pozdější než konec měsíce.');
            return;
        }

        loadTableData(startMonth, endMonth);
    });

    populateMonthOptions();
});
