var clusters = {
    slider : noUiSlider.create(document.getElementById('n-clusters-slider'), 
    { 
        'start' : 2,     
        range: {
            'min': 2,
            'max': 7
        },
        tooltips: [true],
        step: 1
    })
}