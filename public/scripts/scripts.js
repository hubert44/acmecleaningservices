const body = document.querySelector("body"),
    loader = document.querySelector(".loader-wrap"),
    links = document.querySelectorAll('a[href="#"]'),
    aboutSection = document.querySelector('.content-blocks');
	   
// remove loader
function fadeOutEffect() {
    const fadeEffect = setInterval(function() {
        if (!loader.style.opacity) {
            loader.style.opacity = 1;
        }
        if (loader.style.opacity > 0) {
            loader.style.opacity -= 0.4;
        } else {
            body.classList.remove('stopscroll');
            loader.classList.add('remove');
            clearInterval(fadeEffect);
        }
    }, 100);
}
window.addEventListener("load", fadeOutEffect);

links.forEach(link =>
    link.addEventListener("click", function(e) {
        e.preventDefault();
    })
);	

$('.navTrigger').click(function () {
    $(this).toggleClass('active');
    $('body').toggleClass('stopscroll');
    $('.nav').toggleClass('clicked');
    $("#mainListDiv").toggleClass("show_list");
    $("#mainListDiv").fadeIn();
});

$(window).on("resize", function () {
    if ($(window).width() >= 769 && $('.navTrigger').hasClass("active")) {
        $('.navTrigger').removeClass("active");
        $('.nav').removeClass('clicked');
        $("body").removeClass("stopscroll");
        $("#mainListDiv").removeClass("show_list");
    }
});

var $sections = jQuery('.content-block');
    
function toggleSections() {
    $sections.each(function() {
    var $el = jQuery(this);
    
    if($(window).scrollTop() + $(window).height() > $el.offset().top) {
        setTimeout(function() {        
        $el.find('.content-block__item').css('animation-play-state', 'running');
        }, 250)
    }
    });
}

$(window).on('scroll', toggleSections);

toggleSections();

$(document).ready(function() {
  $('.testimonial-slider').slick({
      autoplay: true,
      autoplaySpeed: 3000,
      speed: 600,
      draggable: true,
      infinite: true,
      slidesToShow: 3,
      slidesToScroll: 1,
      arrows: false,
      dots: false,
      responsive: [
          {
            breakpoint: 991,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
            }
          },
          {
              breakpoint: 575,
              settings: {
                slidesToShow: 1,
                slidesToScroll: 1,
              }
          }
      ]
  });

  $('a[href*="#"]:not([href="#"])').click(function() {
    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
      if (target.length) {
        $('html,body').animate({
          scrollTop: target.offset().top
        }, 500);
        return false;
      }
    }
  });

  $('#update-form').on('input change', function() {
    $('#update-but').attr('disabled', false);
  });
}); 

const images = document.querySelectorAll('img');
let timeoutID = 0;

let isBouncing = false;
const debounce = (func, timeframe) => {
  if (isBouncing) {
    return;
  }
  func();
  isBouncing = true;

  timeoutID = setTimeout(() => {
    isBouncing = false;
    clearTimeout(timeoutID);
  }, timeframe);
};

function handleScroll() {
    const { scrollY, innerHeight } = window;
    const fromTopToFold = scrollY + innerHeight;

    images.forEach((image) => {
    const { offsetTop, offsetHeight } = image;

    if (offsetTop <= fromTopToFold - offsetHeight / 2 && offsetTop + offsetHeight >= scrollY) {
      image.classList.add('shown');
    } else {
      image.classList.remove('shown');
    }
  });
}

window.addEventListener('scroll', () => debounce(handleScroll, 200));
handleScroll();

function alertMessage(title, message, icon) {
  Swal.fire(
    title,
    message,
    icon
  );
}
function alertFooter(title, message, icon, link, linkm) { 
  Swal.fire({
    icon: icon,
    title: title,
    text: message,
    footer: `<a href="${link}" style="text-decoration: none;">${linkm}</a>`
  });
}

const signup = (btn) => {
  const username = btn.parentNode.querySelector('[name=username]').value;
  const email = btn.parentNode.querySelector('[name=email]').value;
  const password = btn.parentNode.querySelector('[name=password]').value;
  const csrfToken = btn.parentNode.querySelector('[name=_csrf]').value;
  const btn_spin = btn.querySelector('.btn-spin');
  const btn_text = btn.querySelector('.btn-text');
  const fields = btn.parentNode.querySelectorAll(".border");

  for (let field of fields) {
    field.classList.remove("border-danger");
  }
  btn_spin.style.display = "inline-block";
  btn_text.style.display = "none";

  const signupQuery = {
    query: `
            mutation var($username: String!, $email: String!, $password: String!){
              signup(userInput: {username: $username, email: $email, password: $password}){
                title
                message
                icon
              }
            }
    `,
    variables: {
      username: username,
      email: email,
      password: password
    }
  };

  return fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "csrf-token": csrfToken
    },
    body: JSON.stringify(signupQuery)
  })
  .then(data => {
    return data.json();
  })
  .then(resData => {
    if(resData.errors){
      throw resData.errors[0];
    }
    btn_spin.style.display = "none";
    btn_text.style.display = "inline-block";
    btn.disabled = false;
    for (let field of fields) {
      field.classList.remove("border-danger");
      field.value = "";
    }
    alertMessage(resData.data.signup.title, resData.data.signup.message, resData.data.signup.icon);
  })
  .catch(err => {
    btn_spin.style.display = "none";
    btn_text.style.display = "inline-block";
    if(err.inputField){
      btn.parentNode.querySelector(`[name=${err.inputField}]`).classList.add("border-danger");
    }
    alertMessage(err.title, err.message, err.icon);
    btn.disabled = false;
  });
};

const login = (btn) => {
  const email = btn.parentNode.querySelector('[name=email]').value;
  const password = btn.parentNode.querySelector('[name=password]').value;
  const csrfToken = btn.parentNode.querySelector('[name=_csrf]').value;
  const btn_spin = btn.querySelector('.btn-spin');
  const btn_text = btn.querySelector('.btn-text');
  const fields = btn.parentNode.querySelectorAll(".border");

  for (let field of fields) {
    field.classList.remove("border-danger");
  }
  btn_spin.style.display = "inline-block";
  btn_text.style.display = "none";

  const loginQuery = {
    query: `
            mutation vars($email: String!, $password: String!){
                login(userInput: {email: $email, password: $password})
            }
    `,
    variables: {
      email: email,
      password: password
    }
  };

  fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "csrf-token": csrfToken
    },
    body: JSON.stringify(loginQuery)
  })
  .then(data => data.json())
  .then(resData => {
    if(resData.errors){
      throw resData.errors[0];
    }
    window.location.href = "/account";
  })
  .catch(err => {
    btn_spin.style.display = "none";
    btn_text.style.display = "inline-block";
    if(err.inputField){
      btn.parentNode.querySelector(`[name=${err.inputField}]`).classList.add("border-danger");
    }
    alertMessage(err.title, err.message, err.icon);
    btn.disabled = false;
  });
};

const resetPass = (btn) => {
  const email = btn.parentNode.querySelector('[name=email]').value;
  const csrfToken = btn.parentNode.querySelector('[name=_csrf]').value;
  const btn_spin = btn.querySelector('.btn-spin');
  const btn_text = btn.querySelector('.btn-text');
  const fields = btn.parentNode.querySelectorAll(".border");

  for (let field of fields) {
    field.classList.remove("border-danger");
  }
  btn_spin.style.display = "inline-block";
  btn_text.style.display = "none";

  const resetPassQuery = {
    query: `
            mutation vars($email: String!){
              resetPassword(userInput: {email: $email}){
                title
                message
                icon
              }
            }
    `,
    variables: {
      email: email
    }
  };

  fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "csrf-token": csrfToken
    },
    body: JSON.stringify(resetPassQuery)
  })
  .then(data => data.json())
  .then(resData => {
    if(resData.errors){
      throw resData.errors[0];
    }
    btn_spin.style.display = "none";
    btn_text.style.display = "inline-block";
    btn.disabled = false;
    for (let field of fields) {
      field.classList.remove("border-danger");
      field.value = "";
    }
    alertMessage(resData.data.resetPassword.title, resData.data.resetPassword.message, resData.data.resetPassword.icon);
  })
  .catch(err => {
    btn_spin.style.display = "none";
    btn_text.style.display = "inline-block";
    if(err.inputField){
      btn.parentNode.querySelector(`[name=${err.inputField}]`).classList.add("border-danger");
    }
    alertMessage(err.title, err.message, err.icon);
    btn.disabled = false;
  });
};

const newPass = (btn) => {
  const pass = btn.parentNode.querySelector('[name=password]').value;
  const coPass = btn.parentNode.querySelector('[name=coPassword]').value;
  const userId = btn.parentNode.querySelector('[name=userId]').value;
  const csrfToken = btn.parentNode.querySelector('[name=_csrf]').value;
  const btn_spin = btn.querySelector('.btn-spin');
  const btn_text = btn.querySelector('.btn-text');
  const fields = btn.parentNode.querySelectorAll(".border");
  
  for (let field of fields) {
    field.classList.remove("border-danger");
  }
  btn_spin.style.display = "inline-block";
  btn_text.style.display = "none";

  const newPassQuery = {
    query: `
            mutation vars($userId: String!, $password: String!, $coPassword: String!){
              newPassword(userInput: {userId: $userId, password: $password, coPassword: $coPassword})
            }
    `,
    variables: {
      userId: userId,
      password: pass,
      coPassword: coPass
    }
  };

  fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "csrf-token": csrfToken
    },
    body: JSON.stringify(newPassQuery)
  })
  .then(data => data.json())
  .then(resData => {
    if(resData.errors){
      throw resData.errors[0];
    }
    window.location.href = "/account";
  })
  .catch(err => {
    btn_spin.style.display = "none";
    btn_text.style.display = "inline-block";
    if(err.inputField){
      btn.parentNode.querySelector(`[name=${err.inputField}]`).classList.add("border-danger");
    }
    alertMessage(err.title, err.message, err.icon);
    btn.disabled = false;
  });
};

const updateInfo = (btn) => {
  const username = btn.parentNode.querySelector('[name=username]').value;
  const email = btn.parentNode.querySelector('[name=email]').value;
  const csrfToken = btn.parentNode.querySelector('[name=_csrf]').value;
  const btn_spin = btn.querySelector('.btn-spin');
  const btn_text = btn.querySelector('.btn-text');
  const fields = btn.parentNode.querySelectorAll(".borderr");

  for (let field of fields) {
    field.classList.remove("border-danger");
  }
  btn_spin.style.display = "inline-block";
  btn_text.style.display = "none";

  const updateInfoQuery = {
    query: `
            mutation vars($username: String!, $email: String!){
              updateInfo(userInput: {username: $username, email: $email}){
                title
                message
                icon
              }
            }
    `,
    variables: {
      username: username,
      email: email
    }
  };

  fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "csrf-token": csrfToken
    },
    body: JSON.stringify(updateInfoQuery)
  })
  .then(data => data.json())
  .then(resData => {
    if(resData.errors){
      throw resData.errors[0];
    }
    btn_spin.style.display = "none";
    btn_text.style.display = "inline-block";
    btn.disabled = false;
    for (let field of fields) {
      field.classList.remove("border-danger");
    }
    alertMessage(resData.data.updateInfo.title, resData.data.updateInfo.message, resData.data.updateInfo.icon);
  })
  .catch(err => {
    btn_spin.style.display = "none";
    btn_text.style.display = "inline-block";
    if(err.inputField){
      btn.parentNode.querySelector(`[name=${err.inputField}]`).classList.add("border-danger");
    }
    alertMessage(err.title, err.message, err.icon);
    btn.disabled = false;
  });
};

const updatePass = (btn) => {
  const cuPassword = btn.parentNode.querySelector('[name=cuPassword]').value;
  const newPassword = btn.parentNode.querySelector('[name=newPassword]').value;
  const csrfToken = btn.parentNode.querySelector('[name=_csrf]').value;
  const btn_spin = btn.querySelector('.btn-spin');
  const btn_text = btn.querySelector('.btn-text');
  const fields = btn.parentNode.querySelectorAll(".borderr");

  for (let field of fields) {
    field.classList.remove("border-danger");
  }
  btn_spin.style.display = "inline-block";
  btn_text.style.display = "none";

  const updatePassQuery = {
    query: `
            mutation vars($currentPass: String!, $newPass: String!){
              updatePassword(userInput: {currentPass: $currentPass, newPass: $newPass}){
                title
                message
                icon
              }
            }
    `,
    variables: {
      currentPass: cuPassword,
      newPass: newPassword
    }
  };

  fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "csrf-token": csrfToken
    },
    body: JSON.stringify(updatePassQuery)
  })
  .then(data => data.json())
  .then(resData => {
    if(resData.errors){
      throw resData.errors[0];
    }
    btn_spin.style.display = "none";
    btn_text.style.display = "inline-block";
    btn.disabled = false;
    for (let field of fields) {
      field.classList.remove("border-danger");
      field.value = "";
    }
    alertMessage(resData.data.updatePassword.title, resData.data.updatePassword.message, resData.data.updatePassword.icon);
  })
  .catch(err => {
    btn_spin.style.display = "none";
    btn_text.style.display = "inline-block";
    if(err.inputField){
      btn.parentNode.querySelector(`[name=${err.inputField}]`).classList.add("border-danger");
    }
    alertMessage(err.title, err.message, err.icon);
    btn.disabled = false;
  });
};

const book = (btn) => {
  const cleaningService = btn.parentNode.parentNode.querySelector('[name=cleaningService]').value;
  const cleaningType = btn.parentNode.parentNode.querySelector('[name=cleaningType]').value;
  const apartmentType = btn.parentNode.parentNode.querySelector('[name=apartmentType]').value;
  const cleaningDate = btn.parentNode.parentNode.querySelector('[name=cleaningDate]').value;
  const number = btn.parentNode.parentNode.querySelector('[name=number]').value;
  const serviceFrequency = btn.parentNode.parentNode.querySelector('[name=serviceFrequency]').value;
  const serviceState = btn.parentNode.parentNode.querySelector('[name=serviceState]').value;
  const serviceLocation = btn.parentNode.parentNode.querySelector('[name=serviceLocation]').value;
  const notes = btn.parentNode.parentNode.querySelector('[name=notes]').value;
  const csrfToken = btn.parentNode.querySelector('[name=_csrf]').value;
  const nLogM = "Click here to login";
  const btn_spin = btn.querySelector('.btn-spin');
  const btn_text = btn.querySelector('.btn-text');
  const fields = btn.parentNode.parentNode.querySelectorAll(".border");
  const fieldds = btn.parentNode.parentNode.querySelectorAll(".borderr");

  for (let field of fields) {
    field.classList.remove("border-danger");
  }
  btn_spin.style.display = "inline-block";
  btn_text.style.display = "none";

  const bookQuery = {
    query: `
            mutation var($cleaningService: String!, $cleaningType: String!, $apartmentType: String!, $cleaningDate: String!, $number: String!, $serviceFrequency: String!,
            $serviceState: String!, $serviceLocation: String!, $notes: String!){
              book(userInput: {cleaningService: $cleaningService, cleaningType: $cleaningType, apartmentType: $apartmentType, cleaningDate: $cleaningDate, number: $number, 
              serviceFrequency: $serviceFrequency, serviceState: $serviceState, serviceLocation: $serviceLocation, notes: $notes}){
                title
                message
                icon
              }
            }
    `,
    variables: {
      cleaningService: cleaningService, 
      cleaningType: cleaningType, 
      apartmentType: apartmentType, 
      cleaningDate: cleaningDate, 
      number: number, 
      serviceFrequency: serviceFrequency, 
      serviceState: serviceState, 
      serviceLocation: serviceLocation, 
      notes: notes
    }
  };

  Swal.fire({
    title: 'Confirm booking',
    text: "You won't be able to revert this!",
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, book'
  }).then((result) => {
    if (!result.isConfirmed) {
      throw {message: "Booking canceled", title: "Session", icon: "info"};
    }

    return fetch("/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "csrf-token": csrfToken
      },
      body: JSON.stringify(bookQuery)
    });
  })
  .then(data => {
    return data.json();
  })
  .then(resData => {
    if(resData.errors){
      throw resData.errors[0];
    }
    btn_spin.style.display = "none";
    btn_text.style.display = "inline-block";
    btn.disabled = false;
    for (let field of fieldds) {
      field.classList.remove("border-danger");
      field.value = "";
    }
    alertMessage(resData.data.book.title, resData.data.book.message, resData.data.book.icon);
  })
  .catch(err => {
    btn_spin.style.display = "none";
    btn_text.style.display = "inline-block";
    if(err.inputField){
      btn.parentNode.parentNode.querySelector(`[name=${err.inputField}]`).classList.add("border-danger");
    }
    if(err.nLog){
      alertFooter(err.title, err.message, err.icon, err.nLog, nLogM);
    }else{
      alertMessage(err.title, err.message, err.icon);
    }
    btn.disabled = false;
  });
};

const contact = (btn) => {
  const username = btn.parentNode.querySelector('[name=username]').value;
  const phonenumber = btn.parentNode.querySelector('[name=phonenumber]').value;
  const email = btn.parentNode.querySelector('[name=email]').value;
  const subject = btn.parentNode.querySelector('[name=subject]').value;
  const message = btn.parentNode.querySelector('[name=message]').value;
  const csrfToken = btn.parentNode.querySelector('[name=_csrf]').value;
  const btn_spin = btn.querySelector('.btn-spin');
  const btn_text = btn.querySelector('.btn-text');
  const fields = btn.parentNode.querySelectorAll(".border");

  for (let field of fields) {
    field.classList.remove("border-danger");
  }
  btn_spin.style.display = "inline-block";
  btn_text.style.display = "none";

  const updatePassQuery = {
    query: `
            mutation vars($name: String!, $number: String!, $email: String!, $subject: String!, $message: String!){
              contact(userInput: {name: $name, number: $number, email: $email, subject: $subject, message: $message}){
                title
                message
                icon
              }
            }
    `,
    variables: {
      name: username,
      number: phonenumber,
      email: email,
      subject: subject,
      message: message
    }
  };

  fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "csrf-token": csrfToken
    },
    body: JSON.stringify(updatePassQuery)
  })
  .then(data => data.json())
  .then(resData => {
    if(resData.errors){
      throw resData.errors[0];
    }
    btn_spin.style.display = "none";
    btn_text.style.display = "inline-block";
    btn.disabled = false;
    for (let field of fields) {
      field.classList.remove("border-danger");
      field.value = "";
    }
    alertMessage(resData.data.contact.title, resData.data.contact.message, resData.data.contact.icon);
  })
  .catch(err => {
    btn_spin.style.display = "none";
    btn_text.style.display = "inline-block";
    if(err.inputField){
      btn.parentNode.querySelector(`[name=${err.inputField}]`).classList.add("border-danger");
    }
    alertMessage(err.title, err.message, err.icon);
    btn.disabled = false;
  });
};