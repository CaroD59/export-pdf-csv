import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'canvg';
import 'purify';
import html2canvas from "html2canvas";

// A mettre dans le code pour afficher le bouton en fonction d'une condition
// let visibleButtonExport = $('.class:visible').length > 0;
// let buttonExportStats = $('#button_export_stats');

// if (visibleButtonExport) {
//     buttonExportStats.show();
// } else {
//     buttonExportStats.hide();
// }


let exportPDFButton = $('#export_pdf');
let exportCSVButton = $('#export_csv');
let globalData;

// REPORTING EXPORT
// PDF
function exportPDF() {
    let instance2 = document.getElementById('instance2');
    let tableContainer = document.getElementById('tableContainer');

    // Styles originaux à sauvegarder et restaurer après génération PDF pour instance2
    let originalStylesInstance2 = {
        display: instance2.style.display,
        visibility: instance2.style.visibility,
        position: instance2.style.position,
        left: instance2.style.left,
        top: instance2.style.top,
        width: instance2.style.width,
        height: instance2.style.height
    };

    // Styles originaux à sauvegarder et restaurer après génération PDF pour tableContainer
    let originalStylesTableContainer = tableContainer ? {
        display: tableContainer.style.display,
        visibility: tableContainer.style.visibility,
        position: tableContainer.style.position,
        left: tableContainer.style.left,
        top: tableContainer.style.top,
        width: tableContainer.style.width,
        height: tableContainer.style.height
    } : null;

    // Définir les styles pour une seule page A4 pour instance2
    instance2.style.display = 'block';
    instance2.style.position = 'static';
    instance2.style.left = '0';
    instance2.style.top = '0';
    instance2.style.width = '595.28pt';
    instance2.style.visibility = 'visible';

    let margin = 20;
    let a4Width = 555.28;
    let a4Height = 840;

    let loader = document.createElement('i');
    loader.className = 'spinner-border spinner-border-sm text-white mr-2';

    let exportButton = document.getElementById('button_export_stats');
    exportButton.insertBefore(loader, exportButton.firstChild);

    window.setTimeout(() => {
        // Convertir instance2 en image pour le PDF
        html2canvas(instance2, { scale: 2 }).then(canvas => {
            let imgDataInstance2 = canvas.toDataURL('image/png');
            let imgWidthInstance2 = a4Width;
            let pageHeight = a4Height;
            let imgHeightInstance2 = canvas.height * imgWidthInstance2 / canvas.width;
            let heightLeft = imgHeightInstance2;
            let positionInstance2 = margin;

            let pdf = new jsPDF("p", "pt", "a4");

            // Ajouter instance2 à une nouvelle page dans le PDF si débordement
            pdf.addImage(imgDataInstance2, 'PNG', margin, positionInstance2, imgWidthInstance2, imgHeightInstance2);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                positionInstance2 = heightLeft - imgHeightInstance2 + margin;
                pdf.addPage();
                pdf.addImage(imgDataInstance2, 'PNG', margin, positionInstance2, imgWidthInstance2, imgHeightInstance2);
                heightLeft -= pageHeight;
            }

            // Restaurer les styles d'origine pour instance2
            instance2.style.display = originalStylesInstance2.display;
            instance2.style.visibility = originalStylesInstance2.visibility;
            instance2.style.position = originalStylesInstance2.position;
            instance2.style.left = originalStylesInstance2.left;
            instance2.style.top = originalStylesInstance2.top;
            instance2.style.width = originalStylesInstance2.width;
            instance2.style.height = originalStylesInstance2.height;

            if (tableContainer && tableContainer.childElementCount > 0) {
                // Afficher tableContainer et masquer instance2 pour le convertir en PDF
                instance2.style.display = 'none';
                tableContainer.style.display = 'block';

                // Convertir tableContainer en image pour le PDF
                html2canvas(tableContainer, { scale: 2 }).then(canvas => {
                    let imgWidthTableContainer = a4Width;
                    let pageHeight = a4Height;
                    let imgHeightTableContainer = canvas.height * imgWidthTableContainer / canvas.width;
                    let heightLeft = imgHeightTableContainer;
                    let positionTableContainer = margin;

                    // Découper et ajouter les sections du canvas à de nouvelles pages si débordement
                    let srcImg = canvas;
                    let sX = 0;
                    let sY = 0;
                    let sWidth = canvas.width;
                    let sHeight = Math.min(canvas.height, pageHeight * canvas.width / imgWidthTableContainer);

                    let pageCanvas = document.createElement('canvas');
                    let pageCtx = pageCanvas.getContext('2d');
                    pageCanvas.width = sWidth;
                    pageCanvas.height = sHeight;

                    while (heightLeft > 0) {
                        pageCtx.clearRect(0, 0, sWidth, sHeight);
                        pageCtx.drawImage(srcImg, sX, sY, sWidth, sHeight, 0, 0, sWidth, sHeight);
                        let imgData = pageCanvas.toDataURL('image/png');
                        pdf.addPage();
                        pdf.addImage(imgData, 'PNG', margin, positionTableContainer, imgWidthTableContainer, sHeight * imgWidthTableContainer / sWidth);
                        heightLeft -= sHeight * imgWidthTableContainer / sWidth;
                        sY += sHeight;
                    }

                    // Restaurer les styles d'origine pour tableContainer
                    tableContainer.style.display = originalStylesTableContainer.display;
                    tableContainer.style.visibility = originalStylesTableContainer.visibility;
                    tableContainer.style.position = originalStylesTableContainer.position;
                    tableContainer.style.left = originalStylesTableContainer.left;
                    tableContainer.style.top = originalStylesTableContainer.top;
                    tableContainer.style.width = originalStylesTableContainer.width;
                    tableContainer.style.height = originalStylesTableContainer.height;

                    // Sauvegarder le PDF
                    pdf.save('Reporting.pdf');

                    // Retirer le chargement
                    loader.parentNode.removeChild(loader);
                });
            } else {
                // Si tableContainer est vide ou n'existe pas, sauvegarder le PDF avec seulement instance2
                pdf.save('Reporting.pdf');

                // Retirer le chargement
                loader.parentNode.removeChild(loader);
            }
        });
    }, 1000);
}

// CSV
function exportCSV() {
    let csvData = [];

    // Si marque blanche sélectionnée
    if (marqueblancheSelect) {
        let aggregatedChartData = {
            chart1: { labels: [], data: [] },
            chart2: { labels: [], data: [] },
            chart3: { labels: [], data: [] },
            chart4: { labels: [], data: [] }
        };

        // Parcourir chaque chart et chaque site pour agréger les données
        Object.keys(globalData.chart_data).forEach(chartName => {
            Object.keys(globalData.chart_data[chartName]).forEach(id_site => {
                if (chartName !== 'chart4') {
                    globalData.chart_data[chartName][id_site].data.forEach((value, index) => {
                        let label = globalData.chart_data[chartName][id_site].labels[index];
                        let existingIndex = aggregatedChartData[chartName].labels.indexOf(label);
                        if (existingIndex === -1) {
                            aggregatedChartData[chartName].labels.push(label);
                            aggregatedChartData[chartName].data.push(value);
                        } else {
                            aggregatedChartData[chartName].data[existingIndex] += value;
                        }
                    });
                } else {
                    // Pour chart4, combiner les labels sans additionner les données
                    globalData.chart_data[chartName][id_site].labels.forEach((label, index) => {
                        let existingIndex = aggregatedChartData[chartName].labels.indexOf(label);
                        let value = globalData.chart_data[chartName][id_site].data[index];
                        if (existingIndex === -1) {
                            aggregatedChartData[chartName].labels.push(label);
                            aggregatedChartData[chartName].data.push(value);
                        }
                    });
                }
            });
        });

        // Ajouter les données des charts agrégés au CSV
        for (let chart in aggregatedChartData) {
            let labels = aggregatedChartData[chart].labels;
            let data = aggregatedChartData[chart].data;

            labels.forEach((label, index) => {
                csvData.push({
                    Chart: getChartTitle(chart),
                    Label: label,
                    Data: data[index]
                });
            });
        }

        // Ajoute les données de relances et moyennes d'exploitants
        let totalRar = 0;
        let totalAuto = 0;

        $.each(globalData.relances, function(index, relance) {
            totalRar += relance.rar;
            totalAuto += relance.auto;
        });

        csvData.push({
            Chart: "Nombre de relance",
            Label: "RAR",
            Data: totalRar
        });
        csvData.push({
            Chart: "Nombre de relance",
            Label: "Automatique",
            Data: totalAuto
        });
    } else {
        // Pas de marque blanche sélectionnée, exporter les données normalement
        for (let chart in globalData.chart_data) {
            let labels = globalData.chart_data[chart].labels;
            let data = globalData.chart_data[chart].data;

            labels.forEach((label, index) => {
                csvData.push({
                    Chart: getChartTitle(chart),
                    Label: label,
                    Data: data[index]
                });
            });
        }

        // Ajoute les données de relances et moyennes d'exploitants
        csvData.push({
            Chart: "Nombre de relance",
            Label: "RAR",
            Data: globalData.relances.rar
        });
        csvData.push({
            Chart: "Nombre de relance",
            Label: "Automatique",
            Data: globalData.relances.auto
        });
    }

    csvData.push({
        Chart: "Nombre moyen d'exploitants par procédure",
        Label: "",
        Data: globalData.average_exploitant
    });

    let csv = Papa.unparse(csvData);

    let csvFile = new Blob([csv], { type: "text/csv" });

    let downloadLink = document.createElement("a");
    downloadLink.download = 'Reporting.csv';
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";

    document.body.appendChild(downloadLink);
    downloadLink.click();

    document.body.removeChild(downloadLink);
}

function getChartTitle(chart) {
    switch (chart) {
        case "chart1":
            return "Détail par type de procédure";
        case "chart2":
            return "Détail par type de procédure voirie";
        case "chart3":
            return "Nombre d'exploitants par type de procédure";
        case "chart4":
            return "Nombre de procédures par société";
        default:
            return "Titre inconnu";
    }
}


exportPDFButton.on('click', function () {
    exportPDF();
});

exportCSVButton.on('click', function () {
    exportCSV();
});