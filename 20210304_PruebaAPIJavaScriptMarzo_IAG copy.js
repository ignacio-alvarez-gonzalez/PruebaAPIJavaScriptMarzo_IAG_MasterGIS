require([

    "esri/map",
    "esri/dijit/BasemapToggle",
    "esri/dijit/Search",
    "esri/dijit/Scalebar",
    "esri/layers/FeatureLayer",
    "esri/tasks/FeatureSet",

    "esri/tasks/query",
    "esri/tasks/ServiceAreaTask",
    "esri/tasks/ServiceAreaParameters",
    

    "esri/toolbars/draw",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/graphic", 
    "esri/Color",

    "dojo/ready",
    "dojo/parser",
    "dojo/on",
    "dojo/_base/array",

], function(

    Map,
    BasemapToggle,
    Search,
    Scalebar,
    FeatureLayer,
    FeatureSet,

    Query,
    ServiceAreaTask,
    ServiceAreaParameters,

    Draw,
    SimpleFillSymbol,
    SimpleLineSymbol,
    SimpleMarkerSymbol,
    Graphic,
    Color,

    ready,
    parser,
    on,
    arrayUtils,

){

    ready(function(){

        parser.parse();

        var miMapa = new Map("mapaPrincipal", {
            basemap: "dark-gray-vector",
            center: [-3.70, 40.37],
            zoom: 11
        });

        var miConmutador = new BasemapToggle({
            map: miMapa,
            basemap: "hybrid"
        }, "conmutador");
        miConmutador.startup();

        var miBuscador = new Search({
            map: miMapa
        },"buscador");
        miBuscador.startup();
        
        var miEscala = new Scalebar({
            map: miMapa,
            attachTo: "bottom-left",
            scalebarUnit: "metric"
        });

        // Guardo como variable una nueva feature layer que consuma la url de la capa de centros de salud publicada en ArGIS Online y la añado al mapa:
        var misCentrosDeSalud = new FeatureLayer("https://services8.arcgis.com/BtkRLT3YBKaVGV3g/ArcGIS/rest/services/CentrosSaludProyectados/FeatureServer/0", {
            outFields: ["*"],
        });
        miMapa.addLayer(misCentrosDeSalud);
        console.log(misCentrosDeSalud);

        // SERVICE AREA TASK

        miMapa.on("click", miFuncion);

        function miFuncion(evento){

            miMapa.graphics.clear();

            var instalaciones = new FeatureSet();
            var entidades = [];


            var miSimbolo = new SimpleMarkerSymbol(
                SimpleMarkerSymbol.STYLE_SQUARE, 
                10,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 1),
                new Color([0,0,0])
            );

            var miPunto = new Graphic(evento.mapPoint, miSimbolo);
            miMapa.graphics.add(miPunto);

            entidades.push(miPunto);
            instalaciones.features = entidades

            console.log(instalaciones);

            // Selecciono todas las entidades de la feature layer:
            var miConsulta = new Query();
            miConsulta.where = `1=1`;
            misCentrosDeSalud.selectFeatures(miConsulta, FeatureLayer.SELECTION_NEW, function(seleccion){

                

                // Guardo como feature set en una variable las entidades del feature layer seleccionadas:
                
                // instalaciones.features = seleccion;
                // console.log(instalaciones);

                // Creo mi service area task con el constructor de la clase y la url del servidor proporcionado en el enunciado:
                tareaAreaDeServicio = new ServiceAreaTask("https://localhost:6443/arcgis/rest/services/PFM/20210315_pruebaPublicarServiciosRutas/NAServer/Service%20Area");

                // Creo mis service area parameteres con el constructor de la clase. Lo creo vacío y voy añadiendo propiedades:
                parametrosAreaDeServicio = new ServiceAreaParameters();

                



                // Indico que coja como puntos la variable instalaciones:
                parametrosAreaDeServicio.facilities = instalaciones;
                // Indico la impedancia a usar en la red, obtenida del servidor proporcionado en el enunciado:
                // parametrosAreaDeServicio.impedanceAttribute = "Tiempo_ciclomotor";
                // Indico que la referencia espacial de los polígonos del área de servicio se la misma que la del mapa:
                parametrosAreaDeServicio.outSpatialReference = miMapa.spatialReference;
                // Indico que no cargue los puntos de instalaciones en el mapa:
                parametrosAreaDeServicio.returnFacilities = false;

                parametrosAreaDeServicio.travelMode = "Tiempo en coche";
                
                // Indico el primer punto de ruptura:
                parametrosAreaDeServicio.defaultBreaks= [dojo.byId("intervalo3").value];

                console.log("parametrosAreaDeServicio", parametrosAreaDeServicio);

                // Soluciono el área de servicio:
                tareaAreaDeServicio.solve(parametrosAreaDeServicio, function(resultado){
                console.log("resultados:", resultado);
                
                // Creo la simbología para el polígono del primer intervalo, el exterior en este caso:
                var polygonSymbol = new SimpleFillSymbol(
                    "solid",  
                    new SimpleLineSymbol("solid", new Color([255,255,255]), 1),
                    new Color([255,0,0,0.25])
                );
                
                // Itero por los resultados de la solución para aplicar la simbología a cada polígono y añadirlo al mapa:
                dojo.forEach(resultado.serviceAreaPolygons,function(serviceArea){

                    console.log("Añadiendo area de servicio")

                    serviceArea.setSymbol(polygonSymbol);
                    miMapa.graphics.add(serviceArea);
                });
                
                }, function(err){
                console.log(err.message);
                });

                // Al finalizar la solución, se lanza la función (similar a la anterior) para la siguiente área de servicio:
                tareaAreaDeServicio.on("solve-complete", calcularAreaDeServicio2);

                function calcularAreaDeServicio2(){

                    var instalaciones = new FeatureSet();
                    instalaciones.features = misCentrosDeSalud.graphics;
                    console.log(instalaciones);
        
                    tareaAreaDeServicio2 = new ServiceAreaTask("https://localhost:6443/arcgis/rest/services/PFM/20210315_pruebaPublicarServiciosRutas/NAServer/Service%20Area");
        
                    parametrosAreaDeServicio2 = new ServiceAreaParameters();
        
                    parametrosAreaDeServicio2.facilities = instalaciones;
                    parametrosAreaDeServicio2.impedanceAttribute = "Tiempo_ciclomotor";
                    parametrosAreaDeServicio2.outSpatialReference = miMapa.spatialReference;
                    parametrosAreaDeServicio2.returnFacilities = false;
        
                    parametrosAreaDeServicio2.defaultBreaks= [dojo.byId("intervalo2").value];
        
                    tareaAreaDeServicio2.solve(parametrosAreaDeServicio2,function(resultado){
                    console.log("resultados:", resultado);
        
                        var polygonSymbol = new SimpleFillSymbol(
                            "solid",  
                            new SimpleLineSymbol("solid", new Color([255,255,255]), 1),
                            new Color([255,255,0,0.25])
                        );
        
                        dojo.forEach(resultado.serviceAreaPolygons,function(serviceArea){
                            serviceArea.setSymbol(polygonSymbol);
                            miMapa.graphics.add(serviceArea);
                          });
                        
                    }, function(err){
                        console.log(err.message);
                    });
        
                    tareaAreaDeServicio2.on("solve-complete", calcularAreaDeServicio3);
        
                };

                function calcularAreaDeServicio3(){

                    var instalaciones = new FeatureSet();
                    instalaciones.features = misCentrosDeSalud.graphics;
                    console.log(instalaciones);
        
                    tareaAreaDeServicio3 = new ServiceAreaTask("https://localhost:6443/arcgis/rest/services/PFM/20210315_pruebaPublicarServiciosRutas/NAServer/Service%20Area");
        
                    parametrosAreaDeServicio3 = new ServiceAreaParameters();
        
                    parametrosAreaDeServicio3.facilities = instalaciones;
                    parametrosAreaDeServicio3.impedanceAttribute = "Tiempo_ciclomotor";
                    parametrosAreaDeServicio3.outSpatialReference = miMapa.spatialReference;
                    parametrosAreaDeServicio3.returnFacilities = false;
        
                    parametrosAreaDeServicio3.defaultBreaks= [dojo.byId("intervalo1").value];
        
                    tareaAreaDeServicio3.solve(parametrosAreaDeServicio3,function(resultado){
                        console.log("resultados:", resultado);
        
                        var polygonSymbol = new SimpleFillSymbol(
                            "solid",  
                            new SimpleLineSymbol("solid", new Color([255,255,255]), 1),
                            new Color([0,255,0,0.25])
                        );
        
                        dojo.forEach(resultado.serviceAreaPolygons,function(serviceArea){
                            serviceArea.setSymbol(polygonSymbol);
                            miMapa.graphics.add(serviceArea);
                          });
                        
                    }, function(err){
                        console.log(err.message);
                    });
        
                };

                // var extension = esri.graphicsExtent(seleccion);
                // miMapa.setExtent(extension.getExtent().expand(2));
         
            });

        };

        // Añado un botón para recalcular el área de servicio:
        on(dojo.byId("boton"), "click", miFuncion);





    });

});