// ==UserScript==
// @name         cmsp cheeto
// @namespace    https://cmspweb.ip.tv/
// @version      1.0
// @description  hmmmm cheeto
// @connect	     cmsp.ip.tv
// @connect      edusp-api.ip.tv
// @author       marcos10pc
// @match        https://cmsp.ip.tv/*
// @grant        GM_xmlhttpRequest
// @icon         https://edusp-static.ip.tv/permanent/66aa8b3a1454f7f2b47e21a3/full.x-icon
// ==/UserScript==

(function() {
    'use strict';

    let lesson_regex = /https:\/\/cmsp\.ip\.tv\/mobile\/tms\/task\/\d+\/apply/
    console.log("-- STARTING CMSP CHEETO By marcos10pc --")

    function transformJson(jsonOriginal) {
        let novoJson = {
            status: "submitted",
            accessed_on: jsonOriginal.accessed_on,
            executed_on: jsonOriginal.executed_on,
            answers: {}
        };

        for (let questionId in jsonOriginal.answers) {
            let question = jsonOriginal.answers[questionId];

            let taskQuestion = jsonOriginal.task.questions.find(q => q.id === parseInt(questionId));

            if (taskQuestion.type === "order-sentences") {
                let answer = taskQuestion.options.sentences.map(sentence => sentence.value);

                novoJson.answers[questionId] = {
                    question_id: question.question_id,
                    question_type: taskQuestion.type,
                    answer: answer
                };
            } else if (taskQuestion.type === "fill-letters") {
                let answer = taskQuestion.options.answer;

                novoJson.answers[questionId] = {
                    question_id: question.question_id,
                    question_type: taskQuestion.type,
                    answer: answer
                };
            } else if (taskQuestion.type === "cloud") {
                let answer = taskQuestion.options.ids;

                novoJson.answers[questionId] = {
                    question_id: question.question_id,
                    question_type: taskQuestion.type,
                    answer: answer
                };
            } else {
                let answer = Object.fromEntries(
                    Object.keys(taskQuestion.options).map(optionId => [optionId, taskQuestion.options[optionId].answer])
                );

                novoJson.answers[questionId] = {
                    question_id: question.question_id,
                    question_type: taskQuestion.type,
                    answer: answer
                };
            }
        }
        return novoJson;
    }

    let oldHref = document.location.href;
    const observer = new MutationObserver(() => {
        if (oldHref !== document.location.href) {

            oldHref = document.location.href;
            if (lesson_regex.test(oldHref)) {
                console.log("[DEBUG] LESSON DETECTED");

                let x_auth_key = JSON.parse(sessionStorage.getItem("cmsp.ip.tv:iptvdashboard:state")).auth.auth_token;
                let room_name = JSON.parse(sessionStorage.getItem("cmsp.ip.tv:iptvdashboard:state")).room.room.name;
                let id = oldHref.split("/")[6]
                console.log(`[DEBUG] LESSON_ID: ${id} ROOM_NAME: ${room_name}`)

                let draft_body = {
                    status: "draft",
                    accessed_on: "room",
                    executed_on: room_name,
                    answers: {}
                };

                GM_xmlhttpRequest({
                    method: "POST",
                    url: `https://edusp-api.ip.tv/tms/task/${id}/answer`,
                    headers: {
                        "X-Api-Key": x_auth_key,
                        "Content-Type": "application/json"
                    },
                    data: JSON.stringify(draft_body),
                    onload: function(response) {
                        console.log("[DEBUG] DRAFT_DONE, RESPONSE: ", response.responseText);
                        let response_json = JSON.parse(response.responseText);
                        let task_id = response_json.id
                        let get_anwsers_url = `https://edusp-api.ip.tv/tms/task/${id}/answer/${task_id}?with_task=true&with_genre=true&with_questions=true&with_assessed_skills=true`

                        console.log("[DEBUG] Getting Anwsers...")

                        GM_xmlhttpRequest({
                            method: "GET",
                            url: get_anwsers_url,
                            headers: {
                                "X-Api-Key": x_auth_key,
                                "Content-Type": "application/json"
                            },
                            onload: function(response) {
                                console.log(`[DEBUG] Get Anwsers request received response`)
                                console.log(`[DEBUG] GET ANWSERS RESPONSE: ${response.responseText}`)
                                let get_anwsers_response = JSON.parse(response.responseText);
                                let send_anwsers_body = transformJson(get_anwsers_response);

                                console.log(`[DEBUG] Sending Anwsers... BODY: ${JSON.stringify(send_anwsers_body)}`)

                                GM_xmlhttpRequest({
                                    method: "PUT",
                                    url: `https://edusp-api.ip.tv/tms/task/${id}/answer/${task_id}`,
                                    data: JSON.stringify(send_anwsers_body),
                                    headers: {
                                        "X-Api-Key": x_auth_key,
                                        "Content-Type": "application/json"
                                    },
                                    onload: function(response){
                                        if (response.status !== 200){
                                            alert(`[ERRO] alguma porra aconteceu tentando enviar as resposta RESPONSE: ${response.responseText} `)
                                        }
                                        console.log(`[DEBUG] Anwsers Sent! RESPONSE: ${response.responseText}`)

                                        const watermark = document.querySelector('.MuiTypography-root.MuiTypography-body1.css-1exusee');
                                        if (watermark) {
                                            watermark.textContent = 'Made by marcos10pc :P';
                                            watermark.style.fontSize = '70px';
                                            setTimeout(() => {
                                                document.querySelector('button.MuiButtonBase-root.MuiButton-root.MuiLoadingButton-root.MuiButton-contained.MuiButton-containedInherit.MuiButton-sizeMedium.MuiButton-containedSizeMedium.MuiButton-colorInherit.css-prsfpd').click();
                                            }, 500);
                                        }
                                    }
                                })
                            }

                        })

                    }
                })
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
