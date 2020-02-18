$('.counter').each(function () {
    jQuery({ Counter: 0 }).animate({ Counter: $(this).text() }, {
      duration: 1000,
      easing: 'swing',
      step: function () {
        $(this).text(Math.ceil(this.Counter));
      }
    });
  });