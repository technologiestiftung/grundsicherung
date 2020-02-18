// ===== Scroll to Top ==== 
$(window).scroll(function() {
    if ($(this).scrollTop() >= 200) {        // If page is scrolled more than 200px
        $('.scrollToTop').fadeIn(200);    // Fade in the arrow
    } else {
        $('.scrollToTop').fadeOut(200);   // Else fade out the arrow
    }
});
$('.scrollToTop').click(function() {      // When arrow is clicked
    $('body,html').animate({
        scrollTop : 0                       // Scroll to top of body
    }, 500);
});