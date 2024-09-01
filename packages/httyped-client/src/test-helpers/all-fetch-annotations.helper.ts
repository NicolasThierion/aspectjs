import { Delete } from '../annotations/fetch/delete.annotation';
import { Get } from '../annotations/fetch/get.annotation';
import { Head } from '../annotations/fetch/head.annotation';
import { Option } from '../annotations/fetch/option.annotation';
import { Patch } from '../annotations/fetch/patch.annotation';
import { Post } from '../annotations/fetch/post.annotation';
import { Put } from '../annotations/fetch/put.annotation';

export const ALL_FETCH_ANNOTATIONS = [
  {
    annotation: Get,
    annotationName: `${Get}`,
    method: 'get',
  },
  {
    annotation: Post,
    annotationName: `${Post}`,
    method: 'post',
  },
  {
    annotation: Put,
    annotationName: `${Put}`,
    method: 'put',
  },
  {
    annotation: Delete,
    annotationName: `${Delete}`,
    method: 'delete',
  },
  {
    annotation: Patch,
    annotationName: `${Patch}`,
    method: 'patch',
  },
  {
    annotation: Option,
    annotationName: `${Option}`,
    method: 'option',
  },
  {
    annotation: Head,
    annotationName: `${Head}`,
    method: 'head',
  },
];
