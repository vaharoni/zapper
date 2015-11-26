$(function() {
	$('input[type=submit]').click(function(event) {
		event.stopPropagation();
		// var strength = $('input[name=strength]:radio:checked').val();
		// var duration = $('input[name=duration]:radio:checked').val();

		var strength = 1;
		var duration = $('input[name=strength]').val();
		sendDataToServer(strength, duration, updateStatus);
		return false;
	});
	
	$('#is-connected-btn').click(	function() {
		sendDataToServer('ping', null, updateStatus);
	});
	
	sendDataToServer('ping', null, updateStatus);
});

function sendDataToServer(strength, duration, callback) {
	$.ajax({
	  type: 'POST',
	  url: "/server",
	  data: {strength: strength, duration: duration, client: 'web'},
	  dataType: 'text',
		success: callback
	});
}

function updateStatus(data) {
	console.log(data);
	if (data == "true") {
		$('#is-connected').html('CONNECTED!');
	} else {
		$('#is-connected').html('Not connected');		
	}
}