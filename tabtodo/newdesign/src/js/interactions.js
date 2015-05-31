// TAB MAKE TASK/RETURN
$(".add").click(function () {
	$(this).toggleClass("icon-return");
	$(this).toggleClass("tasked");
	$(this).parent().parent().find(".check_uncheck").toggleClass("Xplus6px");
});



// TAB CLOSE
$(".close").click(function () {
	$(this).parent().parent().remove();
});



// TASKED TAB HOVER
$(".tab").mouseenter(function () {
	if ($(this).find("button").hasClass("tasked")) {
		$(this).find(".check_uncheck, img, p").toggleClass("Xplus48px");
		$(this).find("p").toggleClass("width-minus-54px");
	}
});

$(".tab").mouseleave(function () {
	if ($(this).find("button").hasClass("tasked")) {
		$(this).find(".check_uncheck, img, p").toggleClass("Xplus48px");
		$(this).find("p").toggleClass("width-minus-54px");
	}
});



// CHECK/UNCHECK
$(".check_uncheck").click(function () {
	$(this).find(".check").toggleClass("hidden");
	$(this).find(".uncheck").toggleClass("visible");
	$(this).toggleClass("check_background");
});