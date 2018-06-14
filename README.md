# loq.js

[![Build Status](https://travis-ci.org/biggyspender/loq.svg?branch=master)](https://travis-ci.org/biggyspender/loq) [![npm version](https://badge.fury.io/js/loq.svg)](https://badge.fury.io/js/loq)

A linq inspired library for javascript

Why?

With the advent of javascript iterators and generators, its possible to pipe sequences through a bunch of transformations without materializing collections (arrays) for the intermediate steps. This library attempts to recreate the dotnet linq-to-objects api to provide a number of standard operations on iterable sequences.

How:

Just wrap your iterable with a call to `loq(myIterable)`, and start transforming your data:


    const someNumbers = [1, 2, 3, 4];
    const squares = loq(someNumbers).select(n => n * n);
    for(let v of squares){
        console.log(v);
    }
    
...or if you'd like an array of your results, you can materialize a loq query with the `.toArray()` method:

    const someNumbers = [1, 2, 3, 4];
    const squaresBelowTen = loq(someNumbers).select(n => n * n).where(n => n < 10);
    const arr = squaresBelowTen.toArray();
    console.log(arr);

More examples:

Let's make a collection of cars:

    const cars = [{
        manufacturer:"Ford",
        model:"Escort"
      },{
        manufacturer:"Ford",
        model:"Cortina"
      },{
        manufacturer:"Renault",
        model:"Clio"
      },{
        manufacturer:"Vauxhall",
        model:"Corsa"
      },{
        manufacturer:"Ford",
        model:"Fiesta"
      },{
        manufacturer:"Fiat",
        model:"500"
      }
    ];
    
...and sort them by make then by model:

    const orderedCars = loq(cars).orderBy(c => c.manufacturer).thenBy(c => c.model);
    console.log(orderedCars.toArray());
    
Or we could count the number of cars for each manufacturer:

    const carsPerManufacturer = loq(cars)
      .groupBy(c => c.manufacturer)
      .select(g => ({
        manufacturer:g.key, 
        count:g.count()
      }))
      .orderBy(c => c.manufacturer);
    for(var c of carsPerManufacturer){
      console.log(`${c.manufacturer} : ${c.count}`);
    }
