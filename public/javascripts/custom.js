function formatMoney(number) {
    number = parseInt(number.toString().substr(0, number.toString().length - 2))
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2 }).format(number)
}

function validateEmail(email) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email) && email !== '') {
        return true
    } else {
        return false
    }
}

var $ = window.Checkout.$
var lineItems = []
var cart, discountReduction = 0

$.ajax({
    type: 'GET',
    url: 'https://www.glimark.com/cart.json',
    dataType: 'jsonp',
    success: function(data) {
        cart = data
        $('.total-line--subtotal span').text(formatMoney(cart.original_total_price))
        $('.payment-due__price').text(formatMoney(cart.total_price))
        cart.items.map(function(item) {
            lineItems.push({
                variant_id: item.variant_id,
                quantity: item.quantity
            })
            var productTemplate = `
                    <tr class="product" data-product-id="${item.id}" data-variant-id="${item.variant_id}" data-product-type="${item.product_type}">
                        <td class="product__image">
                            <div class="product-thumbnail">
                                <div class="product-thumbnail__wrapper">
                                    <img alt="${item.product_title}" class="product-thumbnail__image" src="${item.image}" />
                                </div>
                                <span class="product-thumbnail__quantity" aria-hidden="true">${item.quantity}</span>
                            </div>
                        </td>
                        <td class="product__description">
                            <span class="product__description__name order-summary__emphasis">${item.product_title}</span>
                            <span class="product__description__variant order-summary__small-text"></span>
                        </td>
                        <td class="product__quantity visually-hidden">${item.quantity}</td>
                        <td class="product__price">
                            <span class="order-summary__emphasis">${formatMoney(item.line_price)}</span>
                        </td>
                    </tr>
                    `
            $('.product-table tbody').append(productTemplate)
        })
        $('.total-line--reduction .total-line__price').text(`- ${formatMoney(cart.total_price)}`)
        var discount = JSON.parse(localStorage.getItem('discount'))
        if (discount) {
            applyDiscount(discount)
        }
    }
})

$('#checkout_reduction_code').keyup(function(e) {
    if(e.target.value === '') {
        $('.order-summary__section--discount button').addClass('btn--disabled')
    } else {
        $('.order-summary__section--discount button').removeClass('btn--disabled')
    }
})

function errorMessage(type, message) {
    return `<p class="field__message field__message--error" id="error-for-${type}">${message}</p>`
}

function isEmpty(text) {
    return (text === '' || text === null) ? true : false
}

function validateForm() {
    var email = $('#checkout_email'),
        lastName = $('#checkout_shipping_address_last_name'),
        address1 = $('#checkout_shipping_address_address1'),
        city = $('#checkout_shipping_address_city'),
        province = $('#checkout_shipping_address_province'),
        zip = $('#checkout_shipping_address_zip')

    if (!validateEmail(email.val())) {
        email.closest('.field').find('.field__message--error').remove()
        email.closest('.field').addClass('field--error').append(errorMessage('email', 'Please enter a valid email address'))
    }
    if (isEmpty(lastName.val())) {
        lastName.closest('.field').find('.field__message--error').remove()
        lastName.closest('.field').addClass('field--error').append(errorMessage('last_name', 'Please enter your last name'))
    }
    if (isEmpty(address1.val())) {
        address1.closest('.field').find('.field__message--error').remove()
        address1.closest('.field').addClass('field--error').append(errorMessage('address1', 'Please enter your address'))
    }
    if (isEmpty(city.val())) {
        city.closest('.field').find('.field__message--error').remove()
        city.closest('.field').addClass('field--error').append(errorMessage('city', 'Please enter your city'))
    }
    if (isEmpty(province.val())) {
        province.closest('.field').find('.field__message--error').remove()
        province.closest('.field').addClass('field--error').append(errorMessage('province', 'Please select your state / province'))
    }
    if (isEmpty(zip.val())) {
        zip.closest('.field').find('.field__message--error').remove()
        zip.closest('.field').addClass('field--error').append(errorMessage('zip', 'Please enter your zip / postal code'))
    }
}



function resetDiscountForm() {
    $('.order-summary__section--discount button').addClass('btn--disabled')
    $('#checkout_reduction_code').val('')
}

function applyDiscount(data) {
    resetDiscountForm()
    $('.total-line-table__tbody').find('.total-line--reduction').remove()
    discountReduction = parseInt(cart.original_total_price.toString().substr(0, cart.original_total_price.toString().length - 2)) * (parseInt(data.value) / 100)
    $('.total-line-table__tbody').append(`
        <tr class="total-line total-line--reduction" data-discount-success="" data-discount-type="percentage">
            <td class="total-line__name">
                <span>Discount</span>
                <span class="applied-reduction-code">
                    <svg width="16" height="15" xmlns="http://www.w3.org/2000/svg" class="applied-reduction-code__icon" fill="#CE4549">
                        <path d="M14.476 0H8.76c-.404 0-.792.15-1.078.42L.446 7.207c-.595.558-.595 1.463 0 2.022l5.703 5.35c.296.28.687.42 1.076.42.39 0 .78-.14 1.077-.418l7.25-6.79c.286-.268.447-.632.447-1.01V1.43C16 .64 15.318 0 14.476 0zm-2.62 5.77c-.944 0-1.713-.777-1.713-1.732 0-.954.77-1.73 1.714-1.73.945 0 1.714.776 1.714 1.73 0 .955-.768 1.73-1.713 1.73z"></path>
                    </svg>
                    <span class="applied-reduction-code__information">${data.title}</span>
                </span>
                <input value="1" size="30" type="hidden" name="checkout[clear_discount]" id="checkout_clear_discount">
                <button type="submit" class="applied-reduction-code__clear-button icon icon--clear">
                    <span class="visually-hidden">Remove discount</span>
                </button>
            </td>
            <td class="total-line__price">
                <span class="order-summary__emphasis" data-checkout-discount-amount-target="${discountReduction}">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2 }).format(discountReduction)}</span>
            </td>
        </tr>
    `)
    var total = parseInt(cart.total_price.toString().substr(0, cart.total_price.toString().length - 2)) + discountReduction
    $('.payment-due__price').text(new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2 }).format(total))
}

$('.order-summary__section--discount form').submit(function (e) {
    e.preventDefault()
    if (!$('.order-summary__section--discount button').hasClass('btn--disabled')) {
        const discountCode = $('#checkout_reduction_code').val()
        $.ajax({
            type: 'GET',
            url: glimarkAPIUrl + 'discounts?code=' + discountCode.toUpperCase(),
            success: function (data) {
                if (data.length === 1) {
                    var discount = data[0]
                    $.ajax({
                        url: glimarkAPIUrl + 'pricerules/' + discount.price_rule_id,
                        success: function (data) {
                            localStorage.setItem('discount', JSON.stringify(data))
                            applyDiscount(data)
                        }
                    })
                } else {
                    resetDiscountForm()
                }
            }
        })
    }
})

$(document).on('click', '.applied-reduction-code__clear-button', function (e) {
    e.preventDefault()
    $('.total-line-table__tbody').find('.total-line--reduction').remove()
    $('.payment-due__price').text(formatMoney(cart.total_price))
    localStorage.removeItem('discount')
})

if (Shopify.Checkout.step === 'shipping_method') {
    var order = JSON.parse(localStorage.getItem('order'))
    if (order && Object.keys(order.customer).length > 0) {
        $('.review-block__content').text(order.shipping_address.address1 + ', ' + order.shipping_address.province + ', ' + order.shipping_address.country)
    } else {
        window.location.assign('/customer-information.html')
    }
    $('.step form').submit(function (e) {
        e.preventDefault()
    })
}
if (Shopify.Checkout.step === 'contact_information') {
    var order = JSON.parse(localStorage.getItem('order'))
    if (order) {
        $('#checkout_email').val(order.customer.email)
        $('#checkout_shipping_address_first_name').val(order.customer.first_name)
        $('#checkout_shipping_address_last_name').val(order.customer.last_name)
        $('#checkout_shipping_address_address1').val(order.shipping_address.address1)
        $('#checkout_shipping_address_address2').val(order.shipping_address.address2)
        $('#checkout_shipping_address_city').val(order.shipping_address.city)
        $('#checkout_shipping_address_country').val(order.shipping_address.country)
        $('#checkout_shipping_address_province').val(order.shipping_address.province)
        $('#checkout_shipping_address_zip').val(order.shipping_address.zip)
        $('#checkout_shipping_address_phone').val(order.shipping_address.phone)

        // $('#checkout_buyer_accepts_marketing')
        // $('#checkout_remember_me')
    }

    $('.step form').submit(function (e) {
        e.preventDefault()
        validateForm()
        var email = $('#checkout_email').val(),
            isSubscribe = $('#checkout_buyer_accepts_marketing').is(':checked'),
            firstName = $('#checkout_shipping_address_first_name').val(),
            lastName = $('#checkout_shipping_address_last_name').val(),
            address1 = $('#checkout_shipping_address_address1').val(),
            address2 = $('#checkout_shipping_address_address2').val(),
            city = $('#checkout_shipping_address_city').val(),
            country = $('#checkout_shipping_address_country').val(),
            province = $('#checkout_shipping_address_province').val(),
            zip = $('#checkout_shipping_address_zip').val(),
            phone = $('#checkout_shipping_address_phone').val(),
            isRememberMe = $('#checkout_remember_me').is(':checked')
        var order = {
            "line_items": lineItems,
            "customer": {
                "first_name": firstName,
                "last_name": lastName,
                "email": email
            },
            "shipping_address": {
                "first_name": firstName,
                "last_name": lastName,
                "address1": address1,
                "phone": phone,
                "city": city,
                "province": province,
                "country": country,
                "zip": zip
            },
            "email": email,
            "financial_status": "pending"
        }
        localStorage.setItem('order', JSON.stringify(order))
        var countErrors = $('.step__sections').find('.field--error').length
        if(countErrors === 0) {
            window.location.assign('/shipping-method.html')
        }
    })
}
